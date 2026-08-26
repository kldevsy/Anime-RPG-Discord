import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import {
  characters,
  teamMembers,
  teams,
  userCharacters,
  users,
} from "@workspace/db";
import { db, type Team, type TeamMember } from "@workspace/db";
import { createMemoryUser, findMemoryUserByDiscordId, getMemoryCharacters, getMemoryOwnedCharacters, memoryOwned } from "./MemoryStore";

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
    return findMemoryUserByDiscordId(discordId) ?? createMemoryUser(discordId, username);
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
    const user = findMemoryUserByDiscordId(discordId);
    if (!user) return null;
    const allChars = getMemoryCharacters();
    const collection = getMemoryOwnedCharacters(user.id).map((owned) => ({
      ownedId: owned.id, level: owned.level, xp: owned.xp, character: allChars.find((item) => item.id === owned.characterId)!,
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
    return getMemoryCharacters().filter((character) => (!filters.anime || character.anime === filters.anime) && (!filters.rarity || character.rarity === filters.rarity));
  }
  const database = requireDb();
  const conditions: SQL[] = [];
  if (filters.anime) conditions.push(eq(characters.anime, filters.anime));
  if (filters.rarity) conditions.push(eq(characters.rarity, filters.rarity));
  return database.select().from(characters).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(characters.anime), asc(characters.name));
}

export async function getTeam(discordId: string) {
  if (!db) {
    const user = findMemoryUserByDiscordId(discordId);
    if (!user) return null;
    
    console.log(`[TEAM DEBUG] Getting team for discord:${discordId}, user:${user.id}`);
    
    const team = memoryTeams.find((item) => item.userId === user.id);
    if (!team) {
      console.log(`[TEAM DEBUG] No team found`);
      return { team: null, members: [] };
    }
    
    console.log(`[TEAM DEBUG] Found team:${team.id}`);
    
    const allChars = getMemoryCharacters();
    const teamMemberRecords = memoryMembers.filter((member) => member.teamId === team.id);
    
    console.log(`[TEAM DEBUG] Team has ${teamMemberRecords.length} member records`);
    
    const members = teamMemberRecords
      .sort((a, b) => a.position - b.position)
      .map((member) => {
        const owned = memoryOwned.find((item) => item.id === member.userCharacterId);
        if (!owned) {
          console.warn(`[TEAM DEBUG] WARNING: Owned character ${member.userCharacterId} not found!`);
          return null;
        }
        const character = allChars.find((item) => item.id === owned.characterId);
        if (!character) {
          console.warn(`[TEAM DEBUG] WARNING: Character ${owned.characterId} not found!`);
          return null;
        }
        return { 
          position: member.position, 
          ownedId: owned.id, 
          level: owned.level, 
          xp: owned.xp, 
          character 
        };
      })
      .filter(Boolean) as any[];
    
    console.log(`[TEAM DEBUG] Returning ${members.length} valid members`);
    
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
    const user = findMemoryUserByDiscordId(discordId);
    if (!user) throw new Error("User not found. Create a profile first.");
    
    console.log(`[REPLACE TEAM] User ${user.id} replacing team with characters: ${ownedCharacterIds.join(", ")}`);
    
    const owned = getMemoryOwnedCharacters(user.id).filter((item) => ownedCharacterIds.includes(item.id));
    console.log(`[REPLACE TEAM] Found ${owned.length} owned characters out of ${ownedCharacterIds.length} requested`);
    
    if (owned.length !== ownedCharacterIds.length) {
      console.error(`[REPLACE TEAM] ERROR: Missing characters!`);
      console.error(`[REPLACE TEAM] Requested: ${ownedCharacterIds.join(", ")}`);
      console.error(`[REPLACE TEAM] Found: ${owned.map(o => o.id).join(", ")}`);
      throw new Error("One or more characters do not belong to this user.");
    }
    
    let team = memoryTeams.find((item) => item.userId === user.id && item.name === name);
    if (!team) {
      const now = new Date();
      team = { id: crypto.randomUUID(), userId: user.id, name, createdAt: now, updatedAt: now };
      memoryTeams.push(team);
      console.log(`[REPLACE TEAM] Created new team: ${team.id}`);
    } else {
      team.updatedAt = new Date();
      console.log(`[REPLACE TEAM] Updating existing team: ${team.id}`);
    }
    
    // Remove old members
    const oldMemberCount = memoryMembers.filter(m => m.teamId === team.id).length;
    for (let index = memoryMembers.length - 1; index >= 0; index -= 1) {
      if (memoryMembers[index].teamId === team.id) memoryMembers.splice(index, 1);
    }
    console.log(`[REPLACE TEAM] Removed ${oldMemberCount} old members`);
    
    // Add new members
    ownedCharacterIds.forEach((id, index) => memoryMembers.push({ teamId: team!.id, userCharacterId: id, position: index + 1 }));
    console.log(`[REPLACE TEAM] Added ${ownedCharacterIds.length} new members`);
    
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