import { desc, eq, ne } from "drizzle-orm";
import { db, economyTransactions, pvpMatches, pvpProfiles, users } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant } from "../battle/BattleState";
import { getOrCreateUser, getProfile, getTeam } from "./PhaseOneService";

export class PvpServiceError extends Error {}

export interface PvpProfileItem {
  discordId: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
}

export interface PvpMatchResult {
  matchId: string;
  challengerId: string;
  defenderId: string;
  winnerId: string;
  winnerDiscordId: string;
  round: number;
  ratingChange: number;
  challengerNewRating: number;
  defenderNewRating: number;
  result: ReturnType<BattleEngine["run"]>;
  rewards: { gold: number; gems: number };
}

const memoryPvpProfiles: Map<string, { userId: string; discordId: string; username: string; rating: number; wins: number; losses: number }> = new Map();
const memoryPvpMatches: Array<{
  id: string;
  challengerId: string;
  defenderId: string;
  winnerId: string;
  round: number;
  ratingChange: number;
  createdAt: Date;
}> = [];

export async function getPvpProfile(discordId: string): Promise<PvpProfileItem> {
  let profile = await getProfile(discordId);
  if (!profile) {
    await getOrCreateUser(discordId, discordId);
    profile = await getProfile(discordId);
  }
  if (!profile) throw new PvpServiceError("Profile not found.");

  if (!db) {
    let pvp = memoryPvpProfiles.get(discordId);
    if (!pvp) {
      pvp = {
        userId: profile.user.id,
        discordId,
        username: profile.user.username,
        rating: 1000,
        wins: 0,
        losses: 0,
      };
      memoryPvpProfiles.set(discordId, pvp);
    }
    return {
      discordId: pvp.discordId,
      username: pvp.username,
      rating: pvp.rating,
      wins: pvp.wins,
      losses: pvp.losses,
    };
  }

  const database = db;
  let pvpRecord = await database.query.pvpProfiles.findFirst({
    where: eq(pvpProfiles.userId, profile.user.id),
  });

  if (!pvpRecord) {
    const [newPvp] = await database.insert(pvpProfiles).values({
      userId: profile.user.id,
      rating: 1000,
      wins: 0,
      losses: 0,
    }).returning();
    pvpRecord = newPvp;
  }

  return {
    discordId,
    username: profile.user.username,
    rating: pvpRecord.rating,
    wins: pvpRecord.wins,
    losses: pvpRecord.losses,
  };
}

export async function listPvpOpponents(discordId: string, limit = 10): Promise<Array<{ discordId: string; username: string; rating: number }>> {
  if (!db) {
    const all = Array.from(memoryPvpProfiles.values()).filter((p) => p.discordId !== discordId);
    if (all.length === 0) {
      return [
        { discordId: "opp-bot-1", username: "Rival Shinobi", rating: 1050 },
        { discordId: "opp-bot-2", username: "Mestre Pirata", rating: 980 },
      ];
    }
    return all.slice(0, limit).map((p) => ({ discordId: p.discordId, username: p.username, rating: p.rating }));
  }

  const currentUser = await db.query.users.findFirst({ where: eq(users.discordId, discordId) });

  const opponents = await db
    .select({
      discordId: users.discordId,
      username: users.username,
      rating: pvpProfiles.rating,
    })
    .from(pvpProfiles)
    .innerJoin(users, eq(pvpProfiles.userId, users.id))
    .where(currentUser ? ne(users.id, currentUser.id) : undefined)
    .orderBy(desc(pvpProfiles.rating))
    .limit(limit);

  return opponents;
}

export async function challengePvp(challengerDiscordId: string, defenderDiscordId: string): Promise<PvpMatchResult> {
  if (challengerDiscordId === defenderDiscordId) {
    throw new PvpServiceError("You cannot challenge yourself to a PvP match.");
  }

  let challengerProfile = await getProfile(challengerDiscordId);
  if (!challengerProfile) {
    await getOrCreateUser(challengerDiscordId, challengerDiscordId);
    challengerProfile = await getProfile(challengerDiscordId);
  }
  if (!challengerProfile) throw new PvpServiceError("Challenger profile not found.");

  let challengerTeam = await getTeam(challengerDiscordId);
  if (!challengerTeam || !challengerTeam.members.length) {
    if (challengerProfile.collection.length > 0) {
      const { replaceTeam } = await import("./PhaseOneService");
      await replaceTeam(challengerDiscordId, "Equipe Principal", challengerProfile.collection.slice(0, 5).map((c) => c.ownedId));
      challengerTeam = await getTeam(challengerDiscordId);
    }
  }
  if (!challengerTeam || !challengerTeam.members.length) {
    throw new PvpServiceError("Challenger must have an active team for PvP.");
  }

  let defenderTeam = await getTeam(defenderDiscordId);
  let defenderName = defenderDiscordId;
  let defenderUserId = defenderDiscordId;

  let defenderProfile = await getProfile(defenderDiscordId);
  if (!defenderProfile && !defenderDiscordId.startsWith("opp-bot")) {
    await getOrCreateUser(defenderDiscordId, defenderDiscordId);
    defenderProfile = await getProfile(defenderDiscordId);
  }
  if (defenderProfile) {
    defenderName = defenderProfile.user.username;
    defenderUserId = defenderProfile.user.id;
    if (!defenderTeam || !defenderTeam.members.length) {
      if (defenderProfile.collection.length > 0) {
        const { replaceTeam } = await import("./PhaseOneService");
        await replaceTeam(defenderDiscordId, "Equipe Principal", defenderProfile.collection.slice(0, 5).map((c) => c.ownedId));
        defenderTeam = await getTeam(defenderDiscordId);
      }
    }
  }

  const challengerCombatants: Combatant[] = challengerTeam.members.map(({ ownedId, level, character }) => {
    const maxHp = character.baseHp + level * 40;
    return SkillManager.createCombatant({
      id: `c_${ownedId}`,
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
      ultimate: character.ultimate,
    });
  });

  let defenderCombatants: Combatant[] = [];
  if (defenderTeam && defenderTeam.members.length > 0) {
    defenderCombatants = defenderTeam.members.map(({ ownedId, level, character }) => {
      const maxHp = character.baseHp + level * 40;
      return SkillManager.createCombatant({
        id: `d_${ownedId}`,
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
        ultimate: character.ultimate,
      });
    });
  } else {
    defenderCombatants = [
      SkillManager.createCombatant({
        id: "d_ai_1",
        name: defenderName.startsWith("opp-") ? "Guerreiro Rival" : defenderName,
        role: "dps",
        maxHp: 1200,
        hp: 1200,
        attack: 160,
        defense: 80,
        speed: 100,
        critChance: 10,
        critDamage: 1.5,
        energy: 0,
        alive: true,
      }),
    ];
  }

  const result = new BattleEngine(challengerCombatants, defenderCombatants).run();

  const challengerWon = result.phase === "VICTORY";
  const ratingChange = 25;

  if (!db) {
    const challengerPvp = await getPvpProfile(challengerDiscordId);
    let defenderPvp: PvpProfileItem | null = null;
    try {
      defenderPvp = await getPvpProfile(defenderDiscordId);
    } catch {
      // AI fallback profile
    }

    const cObj = memoryPvpProfiles.get(challengerDiscordId)!;
    if (challengerWon) {
      cObj.rating += ratingChange;
      cObj.wins += 1;
      challengerProfile.user.gold += 500;
      challengerProfile.user.gems += 50;
    } else {
      cObj.rating = Math.max(0, cObj.rating - 15);
      cObj.losses += 1;
    }

    if (defenderPvp) {
      const dObj = memoryPvpProfiles.get(defenderDiscordId);
      if (dObj) {
        if (!challengerWon) {
          dObj.rating += ratingChange;
          dObj.wins += 1;
        } else {
          dObj.rating = Math.max(0, dObj.rating - 15);
          dObj.losses += 1;
        }
      }
    }

    const matchId = crypto.randomUUID();
    memoryPvpMatches.push({
      id: matchId,
      challengerId: challengerProfile.user.id,
      defenderId: defenderUserId,
      winnerId: challengerWon ? challengerProfile.user.id : defenderUserId,
      round: result.round,
      ratingChange,
      createdAt: new Date(),
    });

    return {
      matchId,
      challengerId: challengerProfile.user.id,
      defenderId: defenderUserId,
      winnerId: challengerWon ? challengerProfile.user.id : defenderUserId,
      winnerDiscordId: challengerWon ? challengerDiscordId : defenderDiscordId,
      round: result.round,
      ratingChange,
      challengerNewRating: cObj.rating,
      defenderNewRating: memoryPvpProfiles.get(defenderDiscordId)?.rating ?? 1000,
      result,
      rewards: challengerWon ? { gold: 500, gems: 50 } : { gold: 0, gems: 0 },
    };
  }

  const database = db;
  let cUser = await database.query.users.findFirst({ where: eq(users.discordId, challengerDiscordId) });
  if (!cUser) {
    await getOrCreateUser(challengerDiscordId, challengerDiscordId);
    cUser = await database.query.users.findFirst({ where: eq(users.discordId, challengerDiscordId) });
  }
  if (!cUser) throw new PvpServiceError("Challenger user record not found.");

  let dUser = await database.query.users.findFirst({ where: eq(users.discordId, defenderDiscordId) });
  if (!dUser && !defenderDiscordId.startsWith("opp-bot")) {
    await getOrCreateUser(defenderDiscordId, defenderDiscordId);
    dUser = await database.query.users.findFirst({ where: eq(users.discordId, defenderDiscordId) });
  }

  let cPvp = await database.query.pvpProfiles.findFirst({ where: eq(pvpProfiles.userId, cUser.id) });
  if (!cPvp) {
    const [created] = await database.insert(pvpProfiles).values({ userId: cUser.id, rating: 1000, wins: 0, losses: 0 }).returning();
    cPvp = created;
  }

  let dPvp: typeof pvpProfiles.$inferSelect | null = null;
  if (dUser) {
    dPvp = await database.query.pvpProfiles.findFirst({ where: eq(pvpProfiles.userId, dUser.id) }) ?? null;
    if (!dPvp) {
      const [created] = await database.insert(pvpProfiles).values({ userId: dUser.id, rating: 1000, wins: 0, losses: 0 }).returning();
      dPvp = created;
    }
  }

  const winnerUserId = challengerWon ? cUser.id : (dUser ? dUser.id : cUser.id);
  const cNewRating = challengerWon ? cPvp.rating + ratingChange : Math.max(0, cPvp.rating - 15);

  let matchId = "";

  await database.transaction(async (tx) => {
    await tx.update(pvpProfiles).set({
      rating: cNewRating,
      wins: cPvp.wins + (challengerWon ? 1 : 0),
      losses: cPvp.losses + (challengerWon ? 0 : 1),
      updatedAt: new Date(),
    }).where(eq(pvpProfiles.id, cPvp.id));

    if (dPvp && dUser) {
      const dNewRating = !challengerWon ? dPvp.rating + ratingChange : Math.max(0, dPvp.rating - 15);
      await tx.update(pvpProfiles).set({
        rating: dNewRating,
        wins: dPvp.wins + (!challengerWon ? 1 : 0),
        losses: dPvp.losses + (!challengerWon ? 0 : 1),
        updatedAt: new Date(),
      }).where(eq(pvpProfiles.id, dPvp.id));
    }

    if (challengerWon) {
      await tx.update(users).set({
        gold: cUser.gold + 500,
        gems: cUser.gems + 50,
        updatedAt: new Date(),
      }).where(eq(users.id, cUser.id));

      await tx.insert(economyTransactions).values({
        userId: cUser.id,
        currency: "gold",
        amount: 500,
        type: "earn",
        source: "pvp",
        referenceId: `pvp:${Date.now()}`,
      });
    }

    const [match] = await tx.insert(pvpMatches).values({
      challengerId: cUser.id,
      defenderId: dUser ? dUser.id : cUser.id,
      winnerId: winnerUserId,
      round: result.round,
      ratingChange,
    }).returning();
    matchId = match.id;
  });

  return {
    matchId,
    challengerId: cUser.id,
    defenderId: dUser ? dUser.id : cUser.id,
    winnerId: winnerUserId,
    winnerDiscordId: challengerWon ? challengerDiscordId : defenderDiscordId,
    round: result.round,
    ratingChange,
    challengerNewRating: cNewRating,
    defenderNewRating: dPvp ? (!challengerWon ? dPvp.rating + ratingChange : Math.max(0, dPvp.rating - 15)) : 1000,
    result,
    rewards: challengerWon ? { gold: 500, gems: 50 } : { gold: 0, gems: 0 },
  };
}

export async function getPvpLeaderboard(limit = 10): Promise<Array<{ rank: number; discordId: string; username: string; rating: number; wins: number; losses: number }>> {
  if (!db) {
    const sorted = Array.from(memoryPvpProfiles.values()).sort((a, b) => b.rating - a.rating).slice(0, limit);
    return sorted.map((p, index) => ({
      rank: index + 1,
      discordId: p.discordId,
      username: p.username,
      rating: p.rating,
      wins: p.wins,
      losses: p.losses,
    }));
  }

  const leaders = await db
    .select({
      discordId: users.discordId,
      username: users.username,
      rating: pvpProfiles.rating,
      wins: pvpProfiles.wins,
      losses: pvpProfiles.losses,
    })
    .from(pvpProfiles)
    .innerJoin(users, eq(pvpProfiles.userId, users.id))
    .orderBy(desc(pvpProfiles.rating))
    .limit(limit);

  return leaders.map((p, index) => ({
    rank: index + 1,
    discordId: p.discordId,
    username: p.username,
    rating: p.rating,
    wins: p.wins,
    losses: p.losses,
  }));
}
