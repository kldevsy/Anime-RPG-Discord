import { and, desc, eq } from "drizzle-orm";
import { db, economyTransactions, raidParticipants, raids, users } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant } from "../battle/BattleState";
import { getOrCreateUser, getProfile, getTeam } from "./PhaseOneService";

export class RaidServiceError extends Error {}

export interface RaidItem {
  id: string;
  name: string;
  description: string;
  bossName: string;
  currentHp: number;
  maxHp: number;
  bossAttack: number;
  bossDefense: number;
  bossSpeed: number;
  bossPhases: number;
  enrageRound: number;
  rewardGold: number;
  rewardGems: number;
  active: number;
  status: string;
}

export interface RaidLeaderboardEntry {
  rank: number;
  discordId: string;
  username: string;
  damageDealt: number;
  attempts: number;
}

export const MEMORY_RAIDS: RaidItem[] = [
  {
    id: "r1000000-0000-4000-8000-000000000001",
    name: "Raid Global: Kaido das Cem Feras",
    description: "Derrote a criatura mais forte do mundo antes que ele destrua a terra sagrada.",
    bossName: "Kaido Forma Dragão",
    currentHp: 100000,
    maxHp: 100000,
    bossAttack: 350,
    bossDefense: 180,
    bossSpeed: 120,
    bossPhases: 3,
    enrageRound: 6,
    rewardGold: 2000,
    rewardGems: 500,
    active: 1,
    status: "active",
  },
  {
    id: "r1000000-0000-4000-8000-000000000002",
    name: "Raid de Guilda: Madara Uchiha",
    description: "O lendário shinobi despertou com o Susanoo Perfeito.",
    bossName: "Madara Susanoo",
    currentHp: 150000,
    maxHp: 150000,
    bossAttack: 400,
    bossDefense: 200,
    bossSpeed: 125,
    bossPhases: 3,
    enrageRound: 5,
    rewardGold: 3000,
    rewardGems: 800,
    active: 1,
    status: "active",
  },
];

const memoryRaidParticipants: Array<{
  id: string;
  raidId: string;
  userId: string;
  discordId: string;
  username: string;
  damageDealt: number;
  attempts: number;
  lastAttemptAt: Date;
}> = [];

export async function listRaids(): Promise<RaidItem[]> {
  if (!db) {
    return MEMORY_RAIDS.filter((r) => r.active === 1);
  }
  return db.select().from(raids).where(eq(raids.active, 1)) as unknown as RaidItem[];
}

export async function getRaidById(raidId: string): Promise<RaidItem | null> {
  if (!db) {
    return MEMORY_RAIDS.find((r) => r.id === raidId && r.active === 1) ?? null;
  }
  const raidRecord = await db.query.raids.findFirst({
    where: and(eq(raids.id, raidId), eq(raids.active, 1)),
  });
  return (raidRecord as unknown as RaidItem) ?? null;
}

export async function challengeRaid(discordId: string, raidId: string) {
  const raidItem = await getRaidById(raidId);
  if (!raidItem) throw new RaidServiceError("Raid boss not found or inactive.");
  if (raidItem.currentHp <= 0 || raidItem.status !== "active") {
    throw new RaidServiceError("Raid boss is already defeated!");
  }

  if (!db) {
    let profile = await getProfile(discordId);
    if (!profile) {
      await getOrCreateUser(discordId, discordId);
      profile = await getProfile(discordId);
    }
    if (!profile) throw new RaidServiceError("Profile not found.");

    let teamData = await getTeam(discordId);
    if (!teamData || !teamData.members.length) {
      if (profile.collection.length > 0) {
        const { replaceTeam } = await import("./PhaseOneService");
        await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
        teamData = await getTeam(discordId);
      }
    }
    if (!teamData || !teamData.members.length) throw new RaidServiceError("Create a team before challenging raid bosses.");

    const player: Combatant[] = teamData.members.map(({ ownedId, level, character }) => {
      const maxHp = character.baseHp + level * 40;
      return SkillManager.createCombatant({
        id: ownedId,
        name: character.name,
        role: character.role,
        maxHp,
        hp: maxHp,
        attack: character.baseAttack + level * 8,
        defense: character.baseDefense + level * 5,
        speed: character.baseSpeed,
        critChance: 15,
        critDamage: 1.5,
        energy: 0,
        alive: true,
        passive: character.passive ?? undefined,
      });
    });

    const enemy: Combatant[] = [
      SkillManager.createCombatant({
        id: raidItem.id,
        name: raidItem.bossName,
        role: "tank",
        maxHp: raidItem.maxHp,
        hp: raidItem.currentHp,
        attack: raidItem.bossAttack,
        defense: raidItem.bossDefense,
        speed: raidItem.bossSpeed,
        critChance: 10,
        critDamage: 1.5,
        energy: 0,
        alive: true,
        isBoss: true,
        currentPhase: 1,
        maxPhases: raidItem.bossPhases,
        enrageRound: raidItem.enrageRound,
      }),
    ];

    const result = new BattleEngine(player, enemy).run();

    let damageDealt = 0;
    for (const action of result.actions) {
      if (player.some((p) => p.id === action.actorId) && action.amount) {
        damageDealt += action.amount;
      }
    }
    if (damageDealt === 0 && result.phase === "VICTORY") {
      damageDealt = Math.min(raidItem.currentHp, 5000);
    }

    raidItem.currentHp = Math.max(0, raidItem.currentHp - damageDealt);
    if (raidItem.currentHp === 0) {
      raidItem.status = "defeated";
    }

    const goldEarned = Math.floor(raidItem.rewardGold + damageDealt * 0.1);
    const gemsEarned = damageDealt >= 1000 ? Math.floor(raidItem.rewardGems * 0.5) : 10;

    profile.user.gold += goldEarned;
    profile.user.gems += gemsEarned;

    let participant = memoryRaidParticipants.find((p) => p.raidId === raidId && p.userId === profile.user.id);
    if (!participant) {
      participant = {
        id: crypto.randomUUID(),
        raidId,
        userId: profile.user.id,
        discordId: profile.user.discordId,
        username: profile.user.username,
        damageDealt,
        attempts: 1,
        lastAttemptAt: new Date(),
      };
      memoryRaidParticipants.push(participant);
    } else {
      participant.damageDealt += damageDealt;
      participant.attempts += 1;
      participant.lastAttemptAt = new Date();
    }

    return {
      result,
      damageDealt,
      raidStatus: { currentHp: raidItem.currentHp, maxHp: raidItem.maxHp, status: raidItem.status },
      rewards: { gold: goldEarned, gems: gemsEarned },
    };
  }

  const database = db;
  let user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) {
    await getOrCreateUser(discordId, discordId);
    user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  }
  if (!user) throw new RaidServiceError("Profile not found.");

  let teamData = await getTeam(discordId);
  if (!teamData || !teamData.members.length) {
    const profile = await getProfile(discordId);
    if (profile && profile.collection.length > 0) {
      const { replaceTeam } = await import("./PhaseOneService");
      await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
      teamData = await getTeam(discordId);
    }
  }
  if (!teamData || !teamData.members.length) throw new RaidServiceError("Create a team before challenging raid bosses.");

  const player: Combatant[] = teamData.members.map(({ ownedId, level, character }) => {
    const maxHp = character.baseHp + level * 40;
    return SkillManager.createCombatant({
      id: ownedId,
      name: character.name,
      role: character.role,
      maxHp,
      hp: maxHp,
      attack: character.baseAttack + level * 8,
      defense: character.baseDefense + level * 5,
      speed: character.baseSpeed,
      critChance: 15,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      passive: character.passive ?? undefined,
    });
  });

  const enemy: Combatant[] = [
    SkillManager.createCombatant({
      id: raidItem.id,
      name: raidItem.bossName,
      role: "tank",
      maxHp: raidItem.maxHp,
      hp: raidItem.currentHp,
      attack: raidItem.bossAttack,
      defense: raidItem.bossDefense,
      speed: raidItem.bossSpeed,
      critChance: 10,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      isBoss: true,
      currentPhase: 1,
      maxPhases: raidItem.bossPhases,
      enrageRound: raidItem.enrageRound,
    }),
  ];

  const result = new BattleEngine(player, enemy).run();

  let damageDealt = 0;
  for (const action of result.actions) {
    if (player.some((p) => p.id === action.actorId) && action.amount) {
      damageDealt += action.amount;
    }
  }
  if (damageDealt === 0 && result.phase === "VICTORY") {
    damageDealt = Math.min(raidItem.currentHp, 5000);
  }

  const newHp = Math.max(0, raidItem.currentHp - damageDealt);
  const newStatus = newHp === 0 ? "defeated" : "active";

  const goldEarned = Math.floor(raidItem.rewardGold + damageDealt * 0.1);
  const gemsEarned = damageDealt >= 1000 ? Math.floor(raidItem.rewardGems * 0.5) : 10;

  await database.transaction(async (tx) => {
    await tx.update(raids).set({ currentHp: newHp, status: newStatus }).where(eq(raids.id, raidItem.id));

    await tx.update(users).set({
      gold: user.gold + goldEarned,
      gems: user.gems + gemsEarned,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    await tx.insert(economyTransactions).values({
      userId: user.id,
      currency: "gold",
      amount: goldEarned,
      type: "earn",
      source: "raid",
      referenceId: `raid:${raidItem.id}:${Date.now()}`,
    });

    const existingParticipant = await tx.query.raidParticipants.findFirst({
      where: and(eq(raidParticipants.raidId, raidItem.id), eq(raidParticipants.userId, user.id)),
    });

    if (!existingParticipant) {
      await tx.insert(raidParticipants).values({
        raidId: raidItem.id,
        userId: user.id,
        damageDealt,
        attempts: 1,
        lastAttemptAt: new Date(),
      });
    } else {
      await tx.update(raidParticipants).set({
        damageDealt: existingParticipant.damageDealt + damageDealt,
        attempts: existingParticipant.attempts + 1,
        lastAttemptAt: new Date(),
      }).where(eq(raidParticipants.id, existingParticipant.id));
    }
  });

  return {
    result,
    damageDealt,
    raidStatus: { currentHp: newHp, maxHp: raidItem.maxHp, status: newStatus },
    rewards: { gold: goldEarned, gems: gemsEarned },
  };
}

export async function getRaidLeaderboard(raidId: string, limit = 10): Promise<RaidLeaderboardEntry[]> {
  if (!db) {
    const participants = memoryRaidParticipants
      .filter((p) => p.raidId === raidId)
      .sort((a, b) => b.damageDealt - a.damageDealt)
      .slice(0, limit);

    return participants.map((p, index) => ({
      rank: index + 1,
      discordId: p.discordId,
      username: p.username,
      damageDealt: p.damageDealt,
      attempts: p.attempts,
    }));
  }

  const topParticipants = await db
    .select({
      discordId: users.discordId,
      username: users.username,
      damageDealt: raidParticipants.damageDealt,
      attempts: raidParticipants.attempts,
    })
    .from(raidParticipants)
    .innerJoin(users, eq(raidParticipants.userId, users.id))
    .where(eq(raidParticipants.raidId, raidId))
    .orderBy(desc(raidParticipants.damageDealt))
    .limit(limit);

  return topParticipants.map((p, index) => ({
    rank: index + 1,
    discordId: p.discordId,
    username: p.username,
    damageDealt: p.damageDealt,
    attempts: p.attempts,
  }));
}
