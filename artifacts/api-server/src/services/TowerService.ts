import { eq } from "drizzle-orm";
import { db, economyTransactions, towerProgress, users } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant } from "../battle/BattleState";
import { getOrCreateUser, getProfile, getTeam } from "./PhaseOneService";

export class TowerServiceError extends Error {}

export interface TowerStatusItem {
  discordId: string;
  username: string;
  highestFloor: number;
  nextFloor: number;
}

export interface TowerChallengeResult {
  floor: number;
  status: "victory" | "defeat" | "draw";
  result: ReturnType<BattleEngine["run"]>;
  rewards: { gold: number; gems: number; xp: number };
  newHighestFloor: number;
}

const memoryTowerProgress: Map<string, { userId: string; discordId: string; username: string; highestFloor: number }> = new Map();

export async function getTowerProgress(discordId: string): Promise<TowerStatusItem> {
  let profile = await getProfile(discordId);
  if (!profile) {
    await getOrCreateUser(discordId, discordId);
    profile = await getProfile(discordId);
  }
  if (!profile) throw new TowerServiceError("Profile not found.");

  if (!db) {
    let t = memoryTowerProgress.get(discordId);
    if (!t) {
      t = { userId: profile.user.id, discordId, username: profile.user.username, highestFloor: 0 };
      memoryTowerProgress.set(discordId, t);
    }
    return {
      discordId,
      username: profile.user.username,
      highestFloor: t.highestFloor,
      nextFloor: t.highestFloor + 1,
    };
  }

  const database = db;
  let record = await database.query.towerProgress.findFirst({
    where: eq(towerProgress.userId, profile.user.id),
  });

  if (!record) {
    const [created] = await database.insert(towerProgress).values({
      userId: profile.user.id,
      highestFloor: 0,
    }).returning();
    record = created;
  }

  return {
    discordId,
    username: profile.user.username,
    highestFloor: record.highestFloor,
    nextFloor: record.highestFloor + 1,
  };
}

export async function challengeTowerFloor(discordId: string): Promise<TowerChallengeResult> {
  const statusInfo = await getTowerProgress(discordId);
  const targetFloor = statusInfo.nextFloor;

  if (!db) {
    let profile = await getProfile(discordId);
    if (!profile) {
      await getOrCreateUser(discordId, discordId);
      profile = await getProfile(discordId);
    }
    if (!profile) throw new TowerServiceError("Profile not found.");

    let teamData = await getTeam(discordId);
    if (!teamData || !teamData.members.length) {
      if (profile.collection.length > 0) {
        const { replaceTeam } = await import("./PhaseOneService");
        await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
        teamData = await getTeam(discordId);
      }
    }
    if (!teamData || !teamData.members.length) throw new TowerServiceError("Create a team before challenging the tower.");

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

    const isBossFloor = targetFloor % 5 === 0;
    const enemyHp = 500 + targetFloor * 250 + (isBossFloor ? 1000 : 0);
    const enemyAttack = 100 + targetFloor * 20 + (isBossFloor ? 50 : 0);
    const enemyDefense = 50 + targetFloor * 12 + (isBossFloor ? 30 : 0);
    const enemySpeed = 95 + Math.min(50, targetFloor * 2);

    const enemy: Combatant[] = [
      SkillManager.createCombatant({
        id: `tower_floor_${targetFloor}`,
        name: isBossFloor ? `Chefe Guardião (Andar ${targetFloor})` : `Guardião do Andar ${targetFloor}`,
        role: isBossFloor ? "tank" : "dps",
        maxHp: enemyHp,
        hp: enemyHp,
        attack: enemyAttack,
        defense: enemyDefense,
        speed: enemySpeed,
        critChance: 10,
        critDamage: 1.5,
        energy: 0,
        alive: true,
        isBoss: isBossFloor,
        currentPhase: isBossFloor ? 1 : undefined,
        maxPhases: isBossFloor ? 2 : undefined,
        enrageRound: isBossFloor ? 8 : undefined,
      }),
    ];

    const result = new BattleEngine(player, enemy).run();
    const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";

    const rewards = status === "victory"
      ? {
          gold: targetFloor * 200,
          gems: isBossFloor ? 100 : 20,
          xp: targetFloor * 100,
        }
      : { gold: 0, gems: 0, xp: 0 };

    let newHighestFloor = statusInfo.highestFloor;
    if (status === "victory") {
      newHighestFloor = targetFloor;
      profile.user.gold += rewards.gold;
      profile.user.gems += rewards.gems;

      const memProgress = memoryTowerProgress.get(discordId)!;
      memProgress.highestFloor = newHighestFloor;
    }

    return {
      floor: targetFloor,
      status,
      result,
      rewards,
      newHighestFloor,
    };
  }

  const database = db;
  let user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) {
    await getOrCreateUser(discordId, discordId);
    user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  }
  if (!user) throw new TowerServiceError("Profile not found.");

  let teamData = await getTeam(discordId);
  if (!teamData || !teamData.members.length) {
    const profile = await getProfile(discordId);
    if (profile && profile.collection.length > 0) {
      const { replaceTeam } = await import("./PhaseOneService");
      await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
      teamData = await getTeam(discordId);
    }
  }
  if (!teamData || !teamData.members.length) throw new TowerServiceError("Create a team before challenging the tower.");

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

  const isBossFloor = targetFloor % 5 === 0;
  const enemyHp = 500 + targetFloor * 250 + (isBossFloor ? 1000 : 0);
  const enemyAttack = 100 + targetFloor * 20 + (isBossFloor ? 50 : 0);
  const enemyDefense = 50 + targetFloor * 12 + (isBossFloor ? 30 : 0);
  const enemySpeed = 95 + Math.min(50, targetFloor * 2);

  const enemy: Combatant[] = [
    SkillManager.createCombatant({
      id: `tower_floor_${targetFloor}`,
      name: isBossFloor ? `Chefe Guardião (Andar ${targetFloor})` : `Guardião do Andar ${targetFloor}`,
      role: isBossFloor ? "tank" : "dps",
      maxHp: enemyHp,
      hp: enemyHp,
      attack: enemyAttack,
      defense: enemyDefense,
      speed: enemySpeed,
      critChance: 10,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      isBoss: isBossFloor,
      currentPhase: isBossFloor ? 1 : undefined,
      maxPhases: isBossFloor ? 2 : undefined,
      enrageRound: isBossFloor ? 8 : undefined,
    }),
  ];

  const result = new BattleEngine(player, enemy).run();
  const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";

  const rewards = status === "victory"
    ? {
        gold: targetFloor * 200,
        gems: isBossFloor ? 100 : 20,
        xp: targetFloor * 100,
      }
    : { gold: 0, gems: 0, xp: 0 };

  let newHighestFloor = statusInfo.highestFloor;

  if (status === "victory") {
    newHighestFloor = targetFloor;

    await database.transaction(async (tx) => {
      await tx.update(users).set({
        gold: user.gold + rewards.gold,
        gems: user.gems + rewards.gems,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await tx.insert(economyTransactions).values({
        userId: user.id,
        currency: "gold",
        amount: rewards.gold,
        type: "earn",
        source: "tower",
        referenceId: `tower:${targetFloor}:${Date.now()}`,
      });

      const currentRecord = await tx.query.towerProgress.findFirst({
        where: eq(towerProgress.userId, user.id),
      });

      if (!currentRecord) {
        await tx.insert(towerProgress).values({
          userId: user.id,
          highestFloor: newHighestFloor,
        });
      } else {
        await tx.update(towerProgress).set({
          highestFloor: newHighestFloor,
          updatedAt: new Date(),
        }).where(eq(towerProgress.id, currentRecord.id));
      }
    });
  }

  return {
    floor: targetFloor,
    status,
    result,
    rewards,
    newHighestFloor,
  };
}
