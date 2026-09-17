import { db } from "@workspace/db";
import { users, userProfiles, userBattleStats, characterUsageStats, userCharacters, characters, battles, teams, teamMembers } from "@workspace/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

// =============================================
// TIPOS
// =============================================

export interface EnhancedProfile {
  user: {
    id: string;
    discordId: string;
    username: string;
    gold: number;
    gems: number;
    tickets: number;
  };
  profile: {
    bio: string | null;
    favoriteAnime: string | null;
    showcase: Array<{
      id: string;
      name: string;
      anime: string;
      rarity: string;
      level: number;
      imageUrl: string | null;
    }>;
    bannerCharacter: {
      name: string;
      anime: string;
      imageUrl: string | null;
    } | null;
    profileColor: string;
  };
  stats: {
    totalBattles: number;
    totalVictories: number;
    totalDefeats: number;
    winRate: number;
    arenaBattles: number;
    arenaWinRate: number;
    pveBattles: number;
    pveWinRate: number;
    raidBattles: number;
    raidWinRate: number;
    bossRushBattles: number;
    bossRushWinRate: number;
    highestDamageDealt: number;
    totalDamageDealt: number;
    averageDamage: number;
  };
  mostUsedCharacters: Array<{
    name: string;
    anime: string;
    timesUsed: number;
    winRate: number;
    totalDamage: number;
  }>;
  recentBattles: Array<{
    date: Date;
    mode: string;
    result: string;
    rewards: { gold: number; xp: number };
  }>;
}

// =============================================
// GET ENHANCED PROFILE
// =============================================

export async function getEnhancedProfile(discordId: string): Promise<EnhancedProfile> {
  // 1. Buscar usuário
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  // 2. Buscar coleção completa (para contagem e top 3)
  const collection = await db
    .select({
      ownedId: userCharacters.id,
      level: userCharacters.level,
      character: characters,
    })
    .from(userCharacters)
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(userCharacters.userId, user.id));

  // Calcular rarities
  const rarityCounts: Record<string, number> = {};
  for (const item of collection) {
    const rarity = item.character.rarity;
    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
  }

  // Top 3 personagens mais fortes
  const top3 = [...collection]
    .sort((a, b) => {
      const powerA = (a.character.baseAttack * 2) + a.character.baseHp + (a.level * 10);
      const powerB = (b.character.baseAttack * 2) + b.character.baseHp + (b.level * 10);
      return powerB - powerA;
    })
    .slice(0, 3)
    .map(item => ({
      name: item.character.name,
      anime: item.character.anime,
      rarity: item.character.rarity,
      level: item.level,
    }));

  // Poder total
  const totalPower = collection.reduce((sum, item) => {
    return sum + (item.character.baseAttack * 2) + item.character.baseHp + (item.level * 10);
  }, 0);

  // 3. Buscar equipe atual
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.userId, user.id))
    .limit(1);

  let teamMembersList: any[] = [];
  if (team) {
    teamMembersList = await db
      .select({
        name: characters.name,
        anime: characters.anime,
        rarity: characters.rarity,
        level: userCharacters.level,
      })
      .from(teamMembers)
      .innerJoin(userCharacters, eq(teamMembers.userCharacterId, userCharacters.id))
      .innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .where(eq(teamMembers.teamId, team.id))
      .orderBy(teamMembers.position);
  }

  // 4. Buscar/Criar profile
  let [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    [profile] = await db
      .insert(userProfiles)
      .values({ userId: user.id })
      .returning();
  }

  // 3. Buscar/Criar battle stats
  let [battleStats] = await db
    .select()
    .from(userBattleStats)
    .where(eq(userBattleStats.userId, user.id))
    .limit(1);

  if (!battleStats) {
    [battleStats] = await db
      .insert(userBattleStats)
      .values({ userId: user.id })
      .returning();
  }

  // 4. Buscar showcase characters
  const showcaseIds = [profile.showcaseSlot1, profile.showcaseSlot2, profile.showcaseSlot3].filter(Boolean) as string[];
  const showcaseChars = showcaseIds.length > 0
    ? await db
        .select({
          id: userCharacters.id,
          name: characters.name,
          anime: characters.anime,
          rarity: characters.rarity,
          level: userCharacters.level,
          imageUrl: characters.imageUrl,
        })
        .from(userCharacters)
        .innerJoin(characters, eq(userCharacters.characterId, characters.id))
        .where(inArray(userCharacters.id, showcaseIds))
    : [];

  // 5. Buscar banner character
  let bannerChar = null;
  if (profile.bannerCharacterId) {
    const [banner] = await db
      .select({
        name: characters.name,
        anime: characters.anime,
        imageUrl: characters.imageUrl,
        bannerUrl: characters.bannerUrl,
      })
      .from(characters)
      .where(eq(characters.id, profile.bannerCharacterId))
      .limit(1);
    bannerChar = banner || null;
  }

  // 6. Buscar most used characters (top 5)
  const mostUsed = await db
    .select({
      name: characters.name,
      anime: characters.anime,
      timesUsed: characterUsageStats.timesUsed,
      battlesWon: characterUsageStats.battlesWon,
      battlesLost: characterUsageStats.battlesLost,
      totalDamage: characterUsageStats.totalDamageDealt,
    })
    .from(characterUsageStats)
    .innerJoin(userCharacters, eq(characterUsageStats.userCharacterId, userCharacters.id))
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(characterUsageStats.userId, user.id))
    .orderBy(desc(characterUsageStats.timesUsed))
    .limit(5);

  const mostUsedCharacters = mostUsed.map((char) => ({
    name: char.name,
    anime: char.anime,
    timesUsed: char.timesUsed,
    winRate: char.timesUsed > 0 ? (char.battlesWon / char.timesUsed) * 100 : 0,
    totalDamage: char.totalDamage,
  }));

  // 7. Buscar recent battles (últimas 10)
  const recentBattles = await db
    .select({
      createdAt: battles.createdAt,
      status: battles.status,
      rewards: battles.rewards,
    })
    .from(battles)
    .where(eq(battles.userId, user.id))
    .orderBy(desc(battles.createdAt))
    .limit(10);

  const recentBattlesMapped = recentBattles.map((battle) => ({
    date: battle.createdAt,
    mode: "PvE", // TODO: adicionar campo de mode na tabela battles
    result: battle.status === "victory" ? "Vitória" : battle.status === "defeat" ? "Derrota" : "Empate",
    rewards: battle.rewards,
  }));

  // 8. Calcular stats
  const winRate = battleStats.totalBattles > 0 ? (battleStats.totalVictories / battleStats.totalBattles) * 100 : 0;
  const arenaWinRate = battleStats.arenaBattles > 0 ? (battleStats.arenaVictories / battleStats.arenaBattles) * 100 : 0;
  const pveWinRate = battleStats.pveBattles > 0 ? (battleStats.pveVictories / battleStats.pveBattles) * 100 : 0;
  const raidWinRate = battleStats.raidBattles > 0 ? (battleStats.raidVictories / battleStats.raidBattles) * 100 : 0;
  const bossRushWinRate = battleStats.bossRushBattles > 0 ? (battleStats.bossRushVictories / battleStats.bossRushBattles) * 100 : 0;
  const averageDamage = battleStats.totalBattles > 0 ? Math.floor(battleStats.totalDamageDealt / battleStats.totalBattles) : 0;

  return {
    user: {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      gold: user.gold,
      gems: user.gems,
      tickets: user.tickets,
    },
    profile: {
      bio: profile.bio,
      favoriteAnime: profile.favoriteAnime,
      showcase: showcaseChars,
      bannerCharacter: bannerChar,
      profileColor: profile.profileColor || "#7289DA",
      collectionSize: collection.length,
      teamSize: teamMembersList.length,
      totalPower,
      rarityCounts,
      top3,
      teamMembers: teamMembersList,
    },
    stats: {
      totalBattles: battleStats.totalBattles,
      totalVictories: battleStats.totalVictories,
      totalDefeats: battleStats.totalDefeats,
      winRate,
      arenaBattles: battleStats.arenaBattles,
      arenaWinRate,
      pveBattles: battleStats.pveBattles,
      pveWinRate,
      raidBattles: battleStats.raidBattles,
      raidWinRate,
      bossRushBattles: battleStats.bossRushBattles,
      bossRushWinRate,
      highestDamageDealt: battleStats.highestDamageDealt,
      totalDamageDealt: battleStats.totalDamageDealt,
      averageDamage,
    },
    mostUsedCharacters,
    recentBattles: recentBattlesMapped,
  };
}

// =============================================
// UPDATE PROFILE CUSTOMIZATION
// =============================================

export async function updateProfileCustomization(
  discordId: string,
  updates: {
    bio?: string;
    favoriteAnime?: string;
    showcaseSlot1?: string | null;
    showcaseSlot2?: string | null;
    showcaseSlot3?: string | null;
    bannerCharacterId?: string | null;
    profileColor?: string;
  }
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) throw new Error("Usuário não encontrado");

  // Atualizar profile
  await db
    .update(userProfiles)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, user.id));
}

// =============================================
// TRACK BATTLE STATS
// =============================================

export async function trackBattleResult(
  discordId: string,
  mode: "arena" | "pve" | "raid" | "bossrush",
  result: "victory" | "defeat",
  damageDealt: number
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) return;

  const [stats] = await db
    .select()
    .from(userBattleStats)
    .where(eq(userBattleStats.userId, user.id))
    .limit(1);

  if (!stats) {
    await db.insert(userBattleStats).values({ userId: user.id });
  }

  const isVictory = result === "victory";

  const updates: any = {
    totalBattles: sql`${userBattleStats.totalBattles} + 1`,
    totalVictories: isVictory ? sql`${userBattleStats.totalVictories} + 1` : userBattleStats.totalVictories,
    totalDefeats: !isVictory ? sql`${userBattleStats.totalDefeats} + 1` : userBattleStats.totalDefeats,
    totalDamageDealt: sql`${userBattleStats.totalDamageDealt} + ${damageDealt}`,
    highestDamageDealt: sql`GREATEST(${userBattleStats.highestDamageDealt}, ${damageDealt})`,
    updatedAt: new Date(),
  };

  if (mode === "arena") {
    updates.arenaBattles = sql`${userBattleStats.arenaBattles} + 1`;
    if (isVictory) updates.arenaVictories = sql`${userBattleStats.arenaVictories} + 1`;
  } else if (mode === "pve") {
    updates.pveBattles = sql`${userBattleStats.pveBattles} + 1`;
    if (isVictory) updates.pveVictories = sql`${userBattleStats.pveVictories} + 1`;
  } else if (mode === "raid") {
    updates.raidBattles = sql`${userBattleStats.raidBattles} + 1`;
    if (isVictory) updates.raidVictories = sql`${userBattleStats.raidVictories} + 1`;
  } else if (mode === "bossrush") {
    updates.bossRushBattles = sql`${userBattleStats.bossRushBattles} + 1`;
    if (isVictory) updates.bossRushVictories = sql`${userBattleStats.bossRushVictories} + 1`;
  }

  await db
    .update(userBattleStats)
    .set(updates)
    .where(eq(userBattleStats.userId, user.id));
}

// =============================================
// TRACK CHARACTER USAGE
// =============================================

export async function trackCharacterUsage(
  discordId: string,
  userCharacterIds: string[],
  result: "victory" | "defeat",
  damageDealt: number
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) return;

  const isVictory = result === "victory";
  const damagePerChar = Math.floor(damageDealt / userCharacterIds.length);

  for (const userCharId of userCharacterIds) {
    // Upsert character usage stats
    await db
      .insert(characterUsageStats)
      .values({
        userId: user.id,
        userCharacterId: userCharId,
        timesUsed: 1,
        battlesWon: isVictory ? 1 : 0,
        battlesLost: !isVictory ? 1 : 0,
        totalDamageDealt: damagePerChar,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [characterUsageStats.userId, characterUsageStats.userCharacterId],
        set: {
          timesUsed: sql`${characterUsageStats.timesUsed} + 1`,
          battlesWon: isVictory ? sql`${characterUsageStats.battlesWon} + 1` : characterUsageStats.battlesWon,
          battlesLost: !isVictory ? sql`${characterUsageStats.battlesLost} + 1` : characterUsageStats.battlesLost,
          totalDamageDealt: sql`${characterUsageStats.totalDamageDealt} + ${damagePerChar}`,
          lastUsedAt: new Date(),
        },
      });
  }
}
