import { count, desc, eq, sql } from "drizzle-orm";
import { characters, db, teamMembers, teams, userCharacters, userPveProgress, users } from "@workspace/db";
import { getProfile, getTeam } from "./PhaseOneService";

export interface RankingEntry {
  rank: number;
  discordId: string;
  username: string;
  score: number;
  details?: Record<string, unknown>;
}

export async function getWealthLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 1000, details: { gold: 0, gems: 1000 } },
    ];
  }

  const database = db;
  const topUsers = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      gold: users.gold,
      gems: users.gems,
      score: sql<number>`${users.gold} + (${users.gems} * 10)`,
    })
    .from(users)
    .orderBy(desc(sql`${users.gold} + (${users.gems} * 10)`))
    .limit(limit);

  return topUsers.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: u.score,
    details: { gold: u.gold, gems: u.gems },
  }));
}

export async function getPveLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 0, details: { clearedStages: 0 } },
    ];
  }

  const database = db;
  const topPve = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      clearedStages: count(userPveProgress.id),
    })
    .from(users)
    .innerJoin(userPveProgress, eq(users.id, userPveProgress.userId))
    .groupBy(users.id, users.discordId, users.username)
    .orderBy(desc(count(userPveProgress.id)))
    .limit(limit);

  return topPve.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: Number(u.clearedStages),
    details: { clearedStages: Number(u.clearedStages) },
  }));
}

export async function getCollectionLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 3, details: { charactersOwned: 3 } },
    ];
  }

  const database = db;
  const topCollectors = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      totalOwned: count(userCharacters.id),
    })
    .from(users)
    .innerJoin(userCharacters, eq(users.id, userCharacters.userId))
    .groupBy(users.id, users.discordId, users.username)
    .orderBy(desc(count(userCharacters.id)))
    .limit(limit);

  return topCollectors.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: Number(u.totalOwned),
    details: { charactersOwned: Number(u.totalOwned) },
  }));
}

export async function getTeamPowerLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 3050, details: { teamPower: 3050 } },
    ];
  }

  const database = db;
  const teamPowerQuery = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      totalPower: sql<number>`SUM(${characters.baseHp} + ${characters.baseAttack} + ${characters.baseDefense} + ${characters.baseSpeed})`,
    })
    .from(users)
    .innerJoin(teams, eq(users.id, teams.userId))
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .innerJoin(userCharacters, eq(teamMembers.userCharacterId, userCharacters.id))
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .groupBy(users.id, users.discordId, users.username)
    .orderBy(desc(sql`SUM(${characters.baseHp} + ${characters.baseAttack} + ${characters.baseDefense} + ${characters.baseSpeed})`))
    .limit(limit);

  return teamPowerQuery.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: Number(u.totalPower),
    details: { teamPower: Number(u.totalPower) },
  }));
}

export async function getGoldLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 50000, details: { gold: 50000 } },
    ];
  }

  const database = db;
  const topGold = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      gold: users.gold,
    })
    .from(users)
    .orderBy(desc(users.gold))
    .limit(limit);

  return topGold.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: u.gold,
    details: { gold: u.gold },
  }));
}

export async function getGemsLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 10000, details: { gems: 10000 } },
    ];
  }

  const database = db;
  const topGems = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      gems: users.gems,
    })
    .from(users)
    .orderBy(desc(users.gems))
    .limit(limit);

  return topGems.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: u.gems,
    details: { gems: u.gems },
  }));
}

export async function getBattlesWonLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 150, details: { battlesWon: 150 } },
    ];
  }

  const database = db;
  const topBattles = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      totalBattlesWon: users.totalBattlesWon,
    })
    .from(users)
    .orderBy(desc(users.totalBattlesWon))
    .limit(limit);

  return topBattles.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: u.totalBattlesWon,
    details: { battlesWon: u.totalBattlesWon },
  }));
}

export async function getSummonsLeaderboard(limit = 10): Promise<RankingEntry[]> {
  if (!db) {
    return [
      { rank: 1, discordId: "123456789", username: "Jogador Exemplo", score: 200, details: { summons: 200 } },
    ];
  }

  const database = db;
  const topSummons = await database
    .select({
      discordId: users.discordId,
      username: users.username,
      totalSummons: users.totalSummons,
    })
    .from(users)
    .orderBy(desc(users.totalSummons))
    .limit(limit);

  return topSummons.map((u, index) => ({
    rank: index + 1,
    discordId: u.discordId,
    username: u.username,
    score: u.totalSummons,
    details: { summons: u.totalSummons },
  }));
}

// ===== STAT UPDATE HELPERS =====

export async function incrementBattlesWon(discordId: string, amount = 1): Promise<void> {
  if (!db) return;
  
  const database = db;
  await database
    .update(users)
    .set({ 
      totalBattlesWon: sql`${users.totalBattlesWon} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.discordId, discordId));
}

export async function incrementSummons(discordId: string, amount = 1): Promise<void> {
  if (!db) return;
  
  const database = db;
  await database
    .update(users)
    .set({ 
      totalSummons: sql`${users.totalSummons} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.discordId, discordId));
}

export async function incrementPveCleared(discordId: string, amount = 1): Promise<void> {
  if (!db) return;
  
  const database = db;
  await database
    .update(users)
    .set({ 
      totalPveCleared: sql`${users.totalPveCleared} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.discordId, discordId));
}

export async function updateHighestTeamPower(discordId: string, power: number): Promise<void> {
  if (!db) return;
  
  const database = db;
  const user = await database.query.users.findFirst({
    where: eq(users.discordId, discordId),
  });
  
  if (user && power > user.highestTeamPower) {
    await database
      .update(users)
      .set({ 
        highestTeamPower: power,
        updatedAt: new Date(),
      })
      .where(eq(users.discordId, discordId));
  }
}
