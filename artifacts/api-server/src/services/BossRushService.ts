import { randomUUID } from "node:crypto";
import { getDb } from "@db";
import { users, teams, teamMembers, userCharacters, characters, bossRushSeasons, bossRushRuns, bossRushLeaderboard } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant, BattleSnapshot, UltimateDecisionProvider } from "../battle/BattleState";
import { applyTeamEquipment } from "./EquipmentService";

// =============================================
// TIPOS
// =============================================

export interface BossRushBoss {
  id: string;
  name: string;
  anime: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  phase: number;
  difficultyMultiplier: number;
}

export interface BossRushState {
  runId: string;
  userId: string;
  seasonId: string;
  currentBoss: number; // 0-4 (5 bosses total)
  playerTeam: Combatant[];
  bossesDefeated: number;
  totalDamageDealt: number;
  startTime: number;
  phase: "preparing" | "fighting" | "victory" | "defeat";
}

export interface BossRushResult {
  success: boolean;
  bossesDefeated: number;
  totalDamageDealt: number;
  completionTime: number;
  rewards: {
    gold: number;
    gems: number;
  };
  rank?: number;
}

// =============================================
// BOSSES CONFIGURATION (Escalável por fase)
// =============================================

const BOSS_POOL = [
  { name: "Madara Uchiha", anime: "Naruto", role: "dps" as const, element: "dark" },
  { name: "Aizen Sosuke", anime: "Bleach", role: "control" as const, element: "dark" },
  { name: "Meruem", anime: "Hunter x Hunter", role: "tank" as const, element: "neutral" },
  { name: "All For One", anime: "My Hero Academia", role: "dps" as const, element: "dark" },
  { name: "Frieza", anime: "Dragon Ball", role: "dps" as const, element: "neutral" },
  { name: "Muzan Kibutsuji", anime: "Demon Slayer", role: "control" as const, element: "dark" },
  { name: "Escanor", anime: "Seven Deadly Sins", role: "dps" as const, element: "light" },
  { name: "Gilgamesh", anime: "Fate", role: "dps" as const, element: "light" },
];

function generateBosses(): BossRushBoss[] {
  const bosses: BossRushBoss[] = [];
  const shuffled = [...BOSS_POOL].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 5; i++) {
    const bossTemplate = shuffled[i % shuffled.length];
    const difficultyMultiplier = 1 + i * 0.3; // Boss 1: 1.0x, Boss 5: 2.2x

    bosses.push({
      id: randomUUID(),
      name: bossTemplate.name,
      anime: bossTemplate.anime,
      hp: Math.floor(8000 * difficultyMultiplier),
      attack: Math.floor(300 * difficultyMultiplier),
      defense: Math.floor(150 * difficultyMultiplier),
      speed: Math.floor(120 * difficultyMultiplier),
      phase: i + 1,
      difficultyMultiplier,
    });
  }

  return bosses;
}

// =============================================
// SEASON MANAGEMENT
// =============================================

export async function getActiveSeason() {
  const db = getDb();
  const now = new Date();

  const [season] = await db
    .select()
    .from(bossRushSeasons)
    .where(
      and(
        eq(bossRushSeasons.active, 1),
        sql`${bossRushSeasons.startDate} <= ${now}`,
        sql`${bossRushSeasons.endDate} >= ${now}`
      )
    )
    .limit(1);

  return season || null;
}

export async function createNewSeason() {
  const db = getDb();
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  // Desativar temporada anterior
  await db
    .update(bossRushSeasons)
    .set({ active: 0 })
    .where(eq(bossRushSeasons.active, 1));

  const [newSeason] = await db
    .insert(bossRushSeasons)
    .values({
      name: `Temporada ${now.getFullYear()}-S${Math.floor(now.getMonth() / 3) + 1}`,
      startDate: now,
      endDate,
      active: 1,
    })
    .returning();

  return newSeason;
}

// =============================================
// BOSS RUSH RUN
// =============================================

export async function startBossRush(discordId: string): Promise<{
  runId: string;
  bosses: BossRushBoss[];
  playerTeam: Combatant[];
  seasonId: string;
}> {
  const db = getDb();

  // 1. Verificar temporada ativa
  let season = await getActiveSeason();
  if (!season) {
    season = await createNewSeason();
  }

  // 2. Buscar usuário
  const [user] = await db.select().from(users).where(eq(users.discordId, discordId)).limit(1);
  if (!user) throw new Error("Usuário não encontrado");

  // 3. Verificar se já tem run nesta temporada
  const [existingRun] = await db
    .select()
    .from(bossRushRuns)
    .where(and(eq(bossRushRuns.userId, user.id), eq(bossRushRuns.seasonId, season.id)))
    .limit(1);

  if (existingRun) {
    throw new Error("Você já completou o Boss Rush desta temporada! Aguarde a próxima temporada.");
  }

  // 4. Buscar time do jogador
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.userId, user.id))
    .limit(1);

  if (!team) throw new Error("Time não encontrado");

  const members = await db
    .select({
      owned: userCharacters,
      character: characters,
    })
    .from(teamMembers)
    .innerJoin(userCharacters, eq(teamMembers.userCharacterId, userCharacters.id))
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(teamMembers.teamId, team.id))
    .orderBy(teamMembers.position);

  if (members.length === 0) throw new Error("Time vazio");

  // 5. Criar combatentes do jogador
  const playerTeam: Combatant[] = members.map(({ owned, character }) => {
    const level = owned.level;
    const maxHp = character.baseHp + level * 40;

    // Aplicar boost de maestria
    const masteryLevel = owned.masteryLevel || 1;
    const hpBoost = 1 + (masteryLevel - 1) * 0.05;
    const atkBoost = 1 + (masteryLevel - 1) * 0.03;
    const defBoost = 1 + (masteryLevel - 1) * 0.02;

    return SkillManager.createCombatant({
      id: owned.id,
      name: character.name,
      role: character.role,
      element: character.element || "neutral",
      position: character.defaultPosition || undefined,
      maxHp: Math.floor(maxHp * hpBoost),
      hp: Math.floor(maxHp * hpBoost),
      attack: Math.floor((character.baseAttack + level * 8) * atkBoost),
      defense: Math.floor((character.baseDefense + level * 5) * defBoost),
      speed: character.baseSpeed,
      critChance: 15,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      passive: character.passive ?? undefined,
      ultimate: character.ultimate,
    });
  });

  // 6. Aplicar equipamentos
  const userCharacterIds = members.map((m) => m.owned.id);
  const playerWithEquipment = await applyTeamEquipment(playerTeam, userCharacterIds);

  // 7. Gerar bosses
  const bosses = generateBosses();

  // 8. Criar run no banco
  const runId = randomUUID();
  await db.insert(bossRushRuns).values({
    id: runId,
    userId: user.id,
    seasonId: season.id,
    bossesDefeated: 0,
    totalDamageDealt: 0,
    completionTime: 0,
    rewardGold: 0,
    rewardGems: 0,
    teamSnapshot: playerWithEquipment.map((c) => ({
      name: c.name,
      hp: c.hp,
      maxHp: c.maxHp,
    })),
  });

  return {
    runId,
    bosses,
    playerTeam: playerWithEquipment,
    seasonId: season.id,
  };
}

export async function fightBoss(
  playerTeam: Combatant[],
  boss: BossRushBoss,
  onSnapshot?: (snapshot: BattleSnapshot) => Promise<void>,
  ultimateDecisionProvider?: UltimateDecisionProvider
): Promise<{ victory: boolean; damageDealt: number; playerTeamAfter: Combatant[] }> {
  // Criar combatente do boss
  const bossCombatant = SkillManager.createCombatant({
    id: boss.id,
    name: boss.name,
    role: "tank",
    maxHp: boss.hp,
    hp: boss.hp,
    attack: boss.attack,
    defense: boss.defense,
    speed: boss.speed,
    critChance: 10,
    critDamage: 1.6,
    energy: 0,
    alive: true,
    isBoss: true,
    currentPhase: 1,
    maxPhases: boss.phase >= 4 ? 2 : 1,
    enrageRound: 15,
  });

  const engine = new BattleEngine(playerTeam, [bossCombatant]);
  const result = onSnapshot ? await engine.runAnimated(onSnapshot, 100, ultimateDecisionProvider) : await engine.run();

  const victory = result.phase === "VICTORY";
  const damageDealt = boss.hp - (result.enemies[0]?.hp || 0);

  return {
    victory,
    damageDealt,
    playerTeamAfter: result.player,
  };
}

export async function completeBossRush(
  runId: string,
  userId: string,
  seasonId: string,
  bossesDefeated: number,
  totalDamageDealt: number,
  completionTime: number
): Promise<BossRushResult> {
  const db = getDb();

  // Calcular recompensas baseadas em bosses derrotados
  const baseGold = 500;
  const baseGems = 50;
  const rewardGold = baseGold * bossesDefeated * bossesDefeated; // Progressão quadrática
  const rewardGems = baseGems * bossesDefeated;

  // Atualizar run
  await db
    .update(bossRushRuns)
    .set({
      bossesDefeated,
      totalDamageDealt,
      completionTime,
      rewardGold,
      rewardGems,
    })
    .where(eq(bossRushRuns.id, runId));

  // Adicionar ao usuário
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) {
    await db
      .update(users)
      .set({
        gold: user.gold + rewardGold,
        gems: user.gems + rewardGems,
      })
      .where(eq(users.id, userId));
  }

  // Atualizar leaderboard
  await updateLeaderboard(seasonId, userId, bossesDefeated, completionTime, totalDamageDealt);

  // Buscar rank
  const rank = await getUserRank(seasonId, userId);

  return {
    success: bossesDefeated === 5,
    bossesDefeated,
    totalDamageDealt,
    completionTime,
    rewards: {
      gold: rewardGold,
      gems: rewardGems,
    },
    rank,
  };
}

// =============================================
// LEADERBOARD
// =============================================

async function updateLeaderboard(
  seasonId: string,
  userId: string,
  bossesDefeated: number,
  completionTime: number,
  totalDamageDealt: number
) {
  const db = getDb();

  // Upsert no leaderboard
  await db
    .insert(bossRushLeaderboard)
    .values({
      seasonId,
      userId,
      bossesDefeated,
      completionTime,
      totalDamageDealt,
      rank: 0, // Será calculado depois
    })
    .onConflictDoUpdate({
      target: [bossRushLeaderboard.seasonId, bossRushLeaderboard.userId],
      set: {
        bossesDefeated,
        completionTime,
        totalDamageDealt,
        updatedAt: new Date(),
      },
    });

  // Recalcular ranks (ORDER BY: mais bosses > menos tempo > mais dano)
  const leaderboard = await db
    .select({
      id: bossRushLeaderboard.id,
      userId: bossRushLeaderboard.userId,
      bossesDefeated: bossRushLeaderboard.bossesDefeated,
      completionTime: bossRushLeaderboard.completionTime,
      totalDamageDealt: bossRushLeaderboard.totalDamageDealt,
    })
    .from(bossRushLeaderboard)
    .where(eq(bossRushLeaderboard.seasonId, seasonId))
    .orderBy(
      desc(bossRushLeaderboard.bossesDefeated),
      bossRushLeaderboard.completionTime,
      desc(bossRushLeaderboard.totalDamageDealt)
    );

  // Atualizar ranks
  for (let i = 0; i < leaderboard.length; i++) {
    await db
      .update(bossRushLeaderboard)
      .set({ rank: i + 1 })
      .where(eq(bossRushLeaderboard.id, leaderboard[i].id));
  }
}

export async function getLeaderboard(seasonId: string, limit = 20) {
  const db = getDb();

  const leaderboard = await db
    .select({
      rank: bossRushLeaderboard.rank,
      username: users.username,
      bossesDefeated: bossRushLeaderboard.bossesDefeated,
      completionTime: bossRushLeaderboard.completionTime,
      totalDamageDealt: bossRushLeaderboard.totalDamageDealt,
    })
    .from(bossRushLeaderboard)
    .innerJoin(users, eq(bossRushLeaderboard.userId, users.id))
    .where(eq(bossRushLeaderboard.seasonId, seasonId))
    .orderBy(bossRushLeaderboard.rank)
    .limit(limit);

  return leaderboard;
}

async function getUserRank(seasonId: string, userId: string): Promise<number | undefined> {
  const db = getDb();

  const [entry] = await db
    .select({ rank: bossRushLeaderboard.rank })
    .from(bossRushLeaderboard)
    .where(and(eq(bossRushLeaderboard.seasonId, seasonId), eq(bossRushLeaderboard.userId, userId)))
    .limit(1);

  return entry?.rank;
}

export async function getUserBestRun(discordId: string, seasonId: string) {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.discordId, discordId)).limit(1);
  if (!user) return null;

  const [run] = await db
    .select()
    .from(bossRushRuns)
    .where(and(eq(bossRushRuns.userId, user.id), eq(bossRushRuns.seasonId, seasonId)))
    .limit(1);

  return run || null;
}
