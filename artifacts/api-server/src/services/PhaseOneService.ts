import { and, asc, eq, type SQL } from "drizzle-orm";
import {
  characters,
  teamMembers,
  teams,
  userCharacters,
  users,
} from "@workspace/db";
import { db } from "@workspace/db";

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured. Set DATABASE_URL before using RPG data endpoints.");
    this.name = "DatabaseUnavailableError";
  }
}

function requireDb() {
  if (!db) throw new DatabaseUnavailableError();
  return db;
}

export async function getOrCreateUser(discordId: string, username: string) {
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
  const database = requireDb();
  const conditions: SQL[] = [];
  if (filters.anime) conditions.push(eq(characters.anime, filters.anime));
  if (filters.rarity) conditions.push(eq(characters.rarity, filters.rarity));
  return database.select().from(characters).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(characters.anime), asc(characters.name));
}

export async function getTeam(discordId: string) {
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
  const database = requireDb();
  if (ownedCharacterIds.length > 5) throw new Error("A team can contain at most 5 characters.");
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) throw new Error("User not found. Create a profile first.");

  await database.transaction(async (tx) => {
    let team = await tx.query.teams.findFirst({ where: and(eq(teams.userId, user.id), eq(teams.name, name)) });
    if (!team) [team] = await tx.insert(teams).values({ userId: user.id, name }).returning();

    const owned = await tx.select({ id: userCharacters.id }).from(userCharacters)
      .where(and(eq(userCharacters.userId, user.id), ...ownedCharacterIds.map((id) => eq(userCharacters.id, id))));
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