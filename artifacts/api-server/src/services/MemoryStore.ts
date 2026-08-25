import { characterCatalog, type Character, type User, type UserCharacter } from "@workspace/db";

export const customMemoryCharacters: Character[] = [];

export function getMemoryCharacters(): Character[] {
  const catalogChars: Character[] = characterCatalog.map((character, index) => ({
    ...character,
    imageUrl: character.imageUrl ?? null,
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    level: 1,
    catalogManaged: true,
    evolution: null,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)),
  }));
  return [...catalogChars, ...customMemoryCharacters];
}

/**
 * Backwards compatibility export.
 * Note: prefer calling `getMemoryCharacters()` to dynamically reflect changes to `characterCatalog`.
 */
export const memoryCharacters: Character[] = getMemoryCharacters();

export const memoryUsers: User[] = [];
export const memoryOwned: UserCharacter[] = [];

export function findMemoryUserByDiscordId(discordId: string) {
  return memoryUsers.find((user) => user.discordId === discordId);
}

export function createMemoryUser(discordId: string, username: string) {
  const now = new Date();
  const user: User = { id: crypto.randomUUID(), discordId, username, gold: 0, gems: 1000, tickets: 10, createdAt: now, updatedAt: now };
  memoryUsers.push(user);
  getMemoryCharacters().slice(0, 3).forEach((character) => getOrCreateMemoryOwnedCharacter(user.id, character.id, now));
  return user;
}

export function getMemoryOwnedCharacters(userId: string) {
  return memoryOwned.filter((owned) => owned.userId === userId);
}

export function findMemoryOwnedCharacter(userId: string, characterId: string) {
  return memoryOwned.find((owned) => owned.userId === userId && owned.characterId === characterId);
}

export function getOrCreateMemoryOwnedCharacter(userId: string, characterId: string, acquiredAt = new Date()) {
  const existing = findMemoryOwnedCharacter(userId, characterId);
  if (existing) return existing;

  const ownedCharacter: UserCharacter = {
    id: crypto.randomUUID(),
    userId,
    characterId,
    level: 1,
    xp: 0,
    acquiredAt,
  };
  memoryOwned.push(ownedCharacter);
  return ownedCharacter;
}
