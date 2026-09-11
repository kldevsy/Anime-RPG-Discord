import { and, asc, eq } from "drizzle-orm";
import { battleActions, battleSnapshots, battles, characters, teamMembers, teams, userCharacters, users, economyTransactions, inventory } from "@workspace/db";
import { db } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { BattleSnapshot, Combatant, UltimateDecisionProvider } from "../battle/BattleState";
import { getPveStageById, listPveStages, recordPveProgress, type PveStageDrop } from "./PveService";
import { getProfile, getTeam } from "./PhaseOneService";
import { applyMasteryBoost } from "./MasteryService";
import { applyTeamEquipment } from "./EquipmentBattleIntegration";

export class BattleServiceError extends Error {}

interface MemoryBattleRecord {
  id: string;
  userId: string;
  status: "victory" | "defeat" | "draw";
  round: number;
  rewards: { gold: number; xp: number };
  createdAt: Date;
  completedAt: Date;
}

const memoryBattles: MemoryBattleRecord[] = [];

export type BattleSnapshotHandler = (snapshot: BattleSnapshot) => Promise<void> | void;

async function runEngine(engine: BattleEngine, onSnapshot?: BattleSnapshotHandler, ultimateDecisionProvider?: UltimateDecisionProvider): Promise<BattleSnapshot> {
  return onSnapshot ? engine.runAnimated(onSnapshot, 100, ultimateDecisionProvider) : engine.run();
}

export async function runPlayerBattle(discordId: string, stageId?: string, onSnapshot?: BattleSnapshotHandler, ultimateDecisionProvider?: UltimateDecisionProvider) {
  if (!db) {
    const profile = await getProfile(discordId);
    if (!profile) throw new BattleServiceError("Profile not found. Use /perfil to create your profile.");
    
    let teamData = await getTeam(discordId);
    
    console.log(`[BATTLE] User ${discordId} team status: team=${!!teamData?.team}, members=${teamData?.members.length ?? 0}`);
    
    // Só cria time automático se NÃO existir time nenhum
    if (!teamData?.team && profile.collection.length > 0) {
      console.log(`[BATTLE] Auto-creating team from first ${Math.min(5, profile.collection.length)} characters`);
      const { replaceTeam } = await import("./PhaseOneService");
      await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
      teamData = await getTeam(discordId);
    }
    
    if (!teamData || !teamData.members.length) {
      throw new BattleServiceError("No characters in collection. Use /invocar to summon characters first.");
    }
    
    console.log(`[BATTLE] Starting battle with ${teamData.members.length} team members`);
    teamData.members.forEach((m, i) => {
      console.log(`[BATTLE]   ${i + 1}. ${m.character.name} (${m.ownedId})`);
    });

    // Cria combatentes do jogador
    const player: Combatant[] = teamData.members.map(({ ownedId, level, character, masteryLevel, masteryXp }) => {
      const actualMasteryLevel = masteryLevel || 1;
      
      // Aplica boost de maestria aos stats base
      const boostedStats = applyMasteryBoost(
        character.baseHp,
        character.baseAttack,
        character.baseDefense,
        character.baseSpeed,
        actualMasteryLevel
      );
      
      // Calcula HP final com level + maestria
      const maxHp = boostedStats.hp + level * 40;
      
      console.log(`[BATTLE] ${character.name} - Maestria Lv${actualMasteryLevel}: HP ${boostedStats.hp}, ATK ${boostedStats.attack}, DEF ${boostedStats.defense}, SPD ${boostedStats.speed}`);
      
      return SkillManager.createCombatant({
        id: ownedId,
        name: character.name,
        role: character.role,
        element: (character as any).element || "neutral", // ← NOVO
        position: (character as any).defaultPosition || undefined, // ← NOVO (usa posição do DB ou auto)
        maxHp,
        hp: maxHp,
        attack: boostedStats.attack + level * 8,
        defense: boostedStats.defense + level * 5,
        speed: boostedStats.speed,
        critChance: 15,
        critDamage: 1.5,
        energy: 0,
        alive: true,
        passive: character.passive ?? undefined,
        ultimate: character.ultimate,
      });
    });

    // ⚔️ APLICA EQUIPAMENTOS AO TIME DO JOGADOR
    const userCharacterIds = teamData.members.map(m => m.ownedId);
    const playerWithEquipment = await applyTeamEquipment(player, userCharacterIds);
    console.log(`[BATTLE] Equipment applied to player team`);

    let stage = stageId ? await getPveStageById(stageId) : null;
    if (!stage) {
      const stages = await listPveStages();
      stage = stages[0] ?? null;
    }
    if (!stage) throw new BattleServiceError("PvE stage not found.");

    const isBossStage = stage.type === "boss" || stage.type === "raid" || stage.bossPhases > 1;

    const enemy: Combatant[] = [
      SkillManager.createCombatant({
        id: stage.id,
        name: stage.enemyName,
        role: "tank",
        maxHp: stage.enemyHp,
        hp: stage.enemyHp,
        attack: stage.enemyAttack,
        defense: stage.enemyDefense,
        speed: stage.enemySpeed,
        critChance: 8,
        critDamage: 1.4,
        energy: 0,
        alive: true,
        isBoss: isBossStage,
        currentPhase: isBossStage ? 1 : undefined,
        maxPhases: isBossStage ? stage.bossPhases : undefined,
        enrageRound: isBossStage ? stage.enrageRound : undefined,
        drops: stage.drops,
      }),
    ];

    const result = await runEngine(new BattleEngine(playerWithEquipment, enemy), onSnapshot, ultimateDecisionProvider);
    const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";
    const rewards = status === "victory" ? { gold: stage.rewardGold, xp: stage.rewardXp } : { gold: 0, xp: 0 };

    const awardedDrops: PveStageDrop[] = [];
    if (status === "victory" && stage.drops && stage.drops.length > 0) {
      for (const drop of stage.drops) {
        if (Math.random() * 100 < drop.chance) {
          awardedDrops.push(drop);
          if (drop.itemKey === "gems") profile.user.gems += drop.quantity;
          else if (drop.itemKey === "tickets") profile.user.tickets += drop.quantity;
          else if (drop.itemKey === "gold") profile.user.gold += drop.quantity;
        }
      }
    }

    if (status === "victory") {
      profile.user.gold += rewards.gold;
      await recordPveProgress(profile.user.id, stage.id);
    }

    const battleRecord: MemoryBattleRecord = {
      id: crypto.randomUUID(),
      userId: profile.user.id,
      status,
      round: result.round,
      rewards,
      createdAt: new Date(),
      completedAt: new Date(),
    };
    memoryBattles.push(battleRecord);

    return { battle: battleRecord, result, rewards, drops: awardedDrops };
  }

  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) throw new BattleServiceError("Profile not found.");
  const team = await database.query.teams.findFirst({ where: eq(teams.userId, user.id), orderBy: asc(teams.createdAt) });
  if (!team) throw new BattleServiceError("Create a team before starting a battle.");
  const members = await database.select({ member: teamMembers, owned: userCharacters, character: characters })
    .from(teamMembers).innerJoin(userCharacters, eq(teamMembers.userCharacterId, userCharacters.id))
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(teamMembers.teamId, team.id)).orderBy(asc(teamMembers.position));
  if (!members.length) throw new BattleServiceError("Your team is empty.");

  const player: Combatant[] = members.map(({ owned, character }) => {
    const maxHp = character.baseHp + owned.level * 40;
    return SkillManager.createCombatant({
      id: owned.id,
      name: character.name,
      role: character.role,
      maxHp,
      hp: maxHp,
      attack: character.baseAttack + owned.level * 8,
      defense: character.baseDefense + owned.level * 5,
      speed: character.baseSpeed,
      critChance: 15,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      passive: character.passive ?? undefined,
      ultimate: character.ultimate,
    });
  });

  let stage = stageId ? await getPveStageById(stageId) : null;
  if (!stage) {
    const stages = await listPveStages();
    stage = stages[0] ?? null;
  }
  if (!stage) throw new BattleServiceError("PvE stage not found.");

  const isBossStage = stage.type === "boss" || stage.type === "raid" || stage.bossPhases > 1;

  const enemy: Combatant[] = [
    SkillManager.createCombatant({
      id: stage.id,
      name: stage.enemyName,
      role: "tank",
      maxHp: stage.enemyHp,
      hp: stage.enemyHp,
      attack: stage.enemyAttack,
      defense: stage.enemyDefense,
      speed: stage.enemySpeed,
      critChance: 8,
      critDamage: 1.4,
      energy: 0,
      alive: true,
      isBoss: isBossStage,
      currentPhase: isBossStage ? 1 : undefined,
      maxPhases: isBossStage ? stage.bossPhases : undefined,
      enrageRound: isBossStage ? stage.enrageRound : undefined,
      drops: stage.drops,
    }),
  ];

  const result = await runEngine(new BattleEngine(player, enemy), onSnapshot, ultimateDecisionProvider);
  const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";
  const rewards = status === "victory" ? { gold: stage.rewardGold, xp: stage.rewardXp } : { gold: 0, xp: 0 };

  const awardedDrops: PveStageDrop[] = [];
  if (status === "victory" && stage.drops && stage.drops.length > 0) {
    for (const drop of stage.drops) {
      if (Math.random() * 100 < drop.chance) {
        awardedDrops.push(drop);
      }
    }
  }

  return database.transaction(async (tx) => {
    const [battle] = await tx.insert(battles).values({ userId: user.id, status, round: result.round, rewards, completedAt: new Date() }).returning();
    await tx.insert(battleSnapshots).values({ battleId: battle.id, round: result.round, turn: result.turn, state: result as unknown as Record<string, unknown> });
    if (result.actions.length) {
      await tx.insert(battleActions).values(result.actions.map((action) => ({
        battleId: battle.id, round: action.round, actorId: action.actorId, actionType: action.type,
        targetId: action.targetId, amount: action.amount, critical: action.critical ? 1 : 0,
      })));
    }
    if (status === "victory") {
      let updatedGold = user.gold + rewards.gold;
      let updatedGems = user.gems;
      let updatedTickets = user.tickets;

      for (const drop of awardedDrops) {
        if (drop.itemKey === "gems") updatedGems += drop.quantity;
        else if (drop.itemKey === "tickets") updatedTickets += drop.quantity;
        else if (drop.itemKey === "gold") updatedGold += drop.quantity;
        else {
          await tx.insert(inventory).values({ userId: user.id, itemKey: drop.itemKey, quantity: drop.quantity })
            .onConflictDoUpdate({ target: [inventory.userId, inventory.itemKey], set: { quantity: drop.quantity, updatedAt: new Date() } });
        }
      }

      await tx.update(users).set({ gold: updatedGold, gems: updatedGems, tickets: updatedTickets, updatedAt: new Date() }).where(eq(users.id, user.id));
      await tx.insert(economyTransactions).values({ userId: user.id, currency: "gold", amount: rewards.gold, type: "earn", source: "battle", referenceId: `battle:${battle.id}` });
      await recordPveProgress(user.id, stage.id);
    }
    return { battle, result, rewards, drops: awardedDrops };
  });
}

export async function listPlayerBattles(discordId: string) {
  if (!db) {
    const profile = await getProfile(discordId);
    if (!profile) return null;
    return memoryBattles.filter((b) => b.userId === profile.user.id);
  }
  const user = await db.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return null;
  return db.select().from(battles).where(eq(battles.userId, user.id)).orderBy(asc(battles.createdAt));
}
