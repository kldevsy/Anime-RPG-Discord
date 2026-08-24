import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import {
  characters,
  teamMembers,
  teams,
  userCharacters,
  users,
} from "@workspace/db";
import { db, type Character, type Team, type TeamMember, type User, type UserCharacter } from "@workspace/db";

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database mode is disabled. Set USE_DATABASE=true to enable PostgreSQL.");
    this.name = "DatabaseUnavailableError";
  }
}

function requireDb() {
  if (!db) throw new DatabaseUnavailableError();
  return db;
}

const memoryCharacters: Character[] = [
  { id: "00000000-0000-4000-8000-000000000001", anime: "Naruto", name: "Naruto Uzumaki", rarity: "rare", role: "dps", level: 1, baseHp: 920, baseAttack: 180, baseDefense: 105, baseSpeed: 118, imageUrl: null, passive: "Determinação", evolution: null, createdAt: new Date("2026-01-01") },
  { id: "00000000-0000-4000-8000-000000000002", anime: "Naruto", name: "Sakura Haruno", rarity: "uncommon", role: "healer", level: 1, baseHp: 880, baseAttack: 120, baseDefense: 115, baseSpeed: 100, imageUrl: null, passive: "Controle de chakra", evolution: null, createdAt: new Date("2026-01-02") },
  { id: "00000000-0000-4000-8000-000000000003", anime: "One Piece", name: "Monkey D. Luffy", rarity: "epic", role: "tank", level: 1, baseHp: 1250, baseAttack: 165, baseDefense: 135, baseSpeed: 96, imageUrl: null, passive: "Resiliência", evolution: null, createdAt: new Date("2026-01-03") },
  { id: "00000000-0000-4000-8000-000000000004", anime: "Bleach", name: "Ichigo Kurosaki", rarity: "legendary", role: "dps", level: 1, baseHp: 1080, baseAttack: 230, baseDefense: 110, baseSpeed: 125, imageUrl: null, passive: "Pressão espiritual", evolution: null, createdAt: new Date("2026-01-04") },
  { id: "00000000-0000-4000-8000-000000000005", anime: "Dragon Ball", name: "Goku", rarity: "mythic", role: "dps", level: 1, baseHp: 1400, baseAttack: 280, baseDefense: 145, baseSpeed: 130, imageUrl: null, passive: "Instinto de batalha", evolution: null, createdAt: new Date("2026-01-05") },
];
const memoryUsers: User[] = [];
const memoryOwned: UserCharacter[] = [];
const memoryTeams: Team[] = [];
const memoryMembers: TeamMember[] = [];

function assertValidTeamSelection(ownedCharacterIds: string[]) {
  if (ownedCharacterIds.length > 5) throw new Error("A team can contain at most 5 characters.");
  const uniqueIds = new Set(ownedCharacterIds);
  if (uniqueIds.size !== ownedCharacterIds.length) {
    throw new Error("A team cannot contain the same owned character more than once.");
  }
}

export async function getOrCreateUser(discordId: string, username: string) {
  if (!db) {
    const existing = memoryUsers.find((user) => user.discordId === discordId);
    if (existing) return existing;
    const now = new Date();
    const user: User = { id: crypto.randomUUID(), discordId, username, gold: 0, gems: 1000, tickets: 10, createdAt: now, updatedAt: now };
    memoryUsers.push(user);
    memoryCharacters.slice(0, 3).forEach((character) => memoryOwned.push({ id: crypto.randomUUID(), userId: user.id, characterId: character.id, level: 1, xp: 0, acquiredAt: now }));
    return user;
  }
  const database = requireDb();
  const existing = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (existing) return existing;
  return database.transaction(async (tx) => {
    await tx.insert(users).values({ discordId, username }).onConflictDoNothing({ target: users.discordId });
    const created = await tx.query.users.findFirst({ where: eq(users.discordId, discordId) });
    if (!created) throw new Error("Could not create or load the user profile.");
    const starterCharacters = await tx.select({ id: characters.id }).from(characters).orderBy(asc(characters.createdAt)).limit(3);
    if (starterCharacters.length) {
      await tx.insert(userCharacters).values(starterCharacters.map((character) => ({
        userId: created.id,
        characterId: character.id,
      }))).onConflictDoNothing({ target: [userCharacters.userId, userCharacters.characterId] });
    }
    return created;
  });
}

export async function getProfile(discordId: string) {
  if (!db) {
    const user = memoryUsers.find((item) => item.discordId === discordId);
    if (!user) return null;
    const collection = memoryOwned.filter((owned) => owned.userId === user.id).map((owned) => ({
      ownedId: owned.id, level: owned.level, xp: owned.xp, character: memoryCharacters.find((item) => item.id === owned.characterId)!,
    }));
    return { user, collection };
  }
  const database = requireDb();
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return null;
  const collection = await database
    .select({ ownedId: userCharacters.id, level: userCharacters.level, xp: userCharacters.xp, character: characters })
    .from(userCharacters)
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(userCharacters.userId, user.id))
    .orderBy(asc(characters.rarity), asc(characters.name));
  return { user, collection };
}

export async function listCharacters(filters: { anime?: string; rarity?: typeof characters.rarity.enumValues[number] }) {
  if (!db) {
    return memoryCharacters.filter((character) => (!filters.anime || character.anime === filters.anime) && (!filters.rarity || character.rarity === filters.rarity));
  }
  const database = requireDb();
  const conditions: SQL[] = [];
  if (filters.anime) conditions.push(eq(characters.anime, filters.anime));
  if (filters.rarity) conditions.push(eq(characters.rarity, filters.rarity));
  return database.select().from(characters).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(characters.anime), asc(characters.name));
}

export async function getTeam(discordId: string) {
  if (!db) {
    const user = memoryUsers.find((item) => item.discordId === discordId);
    if (!user) return null;
    const team = memoryTeams.find((item) => item.userId === user.id);
    if (!team) return { team: null, members: [] };
    const members = memoryMembers.filter((member) => member.teamId === team.id).sort((a, b) => a.position - b.position).map((member) => {
      const owned = memoryOwned.find((item) => item.id === member.userCharacterId)!;
      return { position: member.position, ownedId: owned.id, level: owned.level, xp: owned.xp, character: memoryCharacters.find((item) => item.id === owned.characterId)! };
    });
    return { team, members };
  }
  const database = requireDb();
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return null;
  const team = await database.query.teams.findFirst({ where: eq(teams.userId, user.id) });
  if (!team) return { team: null, members: [] };
  const members = await database
    .select({ position: teamMembers.position, ownedId: userCharacters.id, level: userCharacters.level, xp: userCharacters.xp, character: characters })
    .from(teamMembers)
    .innerJoin(userCharacters, eq(teamMembers.userCharacterId, userCharacters.id))
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(teamMembers.teamId, team.id))
    .orderBy(asc(teamMembers.position));
  return { team, members };
}

export async function replaceTeam(discordId: string, name: string, ownedCharacterIds: string[]) {
  assertValidTeamSelection(ownedCharacterIds);

  if (!db) {
    const user = memoryUsers.find((item) => item.discordId === discordId);
    if (!user) throw new Error("User not found. Create a profile first.");
    const owned = memoryOwned.filter((item) => item.userId === user.id && ownedCharacterIds.includes(item.id));
    if (owned.length !== ownedCharacterIds.length) throw new Error("One or more characters do not belong to this user.");
    let team = memoryTeams.find((item) => item.userId === user.id && item.name === name);
    if (!team) {
      const now = new Date();
      team = { id: crypto.randomUUID(), userId: user.id, name, createdAt: now, updatedAt: now };
      memoryTeams.push(team);
    } else {
      team.updatedAt = new Date();
    }
    for (let index = memoryMembers.length - 1; index >= 0; index -= 1) {
      if (memoryMembers[index].teamId === team.id) memoryMembers.splice(index, 1);
    }
    ownedCharacterIds.forEach((id, index) => memoryMembers.push({ teamId: team!.id, userCharacterId: id, position: index + 1 }));
    return getTeam(discordId);
  }
  const database = requireDb();
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) throw new Error("User not found. Create a profile first.");

  await database.transaction(async (tx) => {
    let team = await tx.query.teams.findFirst({ where: and(eq(teams.userId, user.id), eq(teams.name, name)) });
    if (!team) [team] = await tx.insert(teams).values({ userId: user.id, name }).returning();
    else await tx.update(teams).set({ updatedAt: new Date() }).where(eq(teams.id, team.id));

    const owned = await tx.select({ id: userCharacters.id }).from(userCharacters)
      .where(and(eq(userCharacters.userId, user.id), inArray(userCharacters.id, ownedCharacterIds)));
    if (owned.length !== ownedCharacterIds.length) throw new Error("One or more characters do not belong to this user.");

    await tx.delete(teamMembers).where(eq(teamMembers.teamId, team.id));
    if (ownedCharacterIds.length) {
      await tx.insert(teamMembers).values(ownedCharacterIds.map((id, index) => ({
        teamId: team.id,
        userCharacterId: id,
        position: index + 1,
      })));
    }
    return team.id;
  });
  return getTeam(discordId);
}