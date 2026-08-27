import { characterCatalog, type Character, type User, type UserCharacter } from "@workspace/db";
import { createHash } from "node:crypto";

export const customMemoryCharacters: Character[] = [];

let catalogCache: Character[] | null = null;
let catalogHashCache: string | null = null;

/**
 * Calcula hash do catálogo para detectar mudanças
 */
function computeCatalogHash(): string {
  const catalogData = JSON.stringify(characterCatalog);
  return createHash("sha256").update(catalogData).digest("hex");
}

/**
 * Obtém personagens da memória, detectando automaticamente mudanças no catálogo.
 * 
 * Elimina necessidade de reiniciar o servidor ao adicionar/modificar personagens
 * em characters.ts. O cache é invalidado automaticamente quando detecta mudanças.
 */
export function getMemoryCharacters(): Character[] {
  const currentHash = computeCatalogHash();

  // Invalida cache se o catálogo mudou
  if (catalogHashCache !== currentHash) {
    catalogCache = null;
    catalogHashCache = currentHash;
    console.log("[MemoryStore] Catálogo atualizado detectado, cache invalidado");
  }

  // Reconstrói cache se necessário
  if (!catalogCache) {
    const catalogChars: Character[] = characterCatalog.map((character, index) => ({
      ...character,
      imageUrl: character.imageUrl ?? null,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      level: 1,
      catalogManaged: true,
      evolution: null,
      createdAt: new Date(Date.UTC(2026, 0, index + 1)),
    }));
    catalogCache = [...catalogChars, ...customMemoryCharacters];
  }

  return catalogCache;
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
  if (existing) {
    console.log(`[MEMORY] Found existing owned character: user=${userId}, char=${characterId}, ownedId=${existing.id}`);
    return existing;
  }

  const ownedCharacter: UserCharacter = {
    id: crypto.randomUUID(),
    userId,
    characterId,
    level: 1,
    xp: 0,
    masteryLevel: 1,
    masteryXp: 0,
    acquiredAt,
  };
  memoryOwned.push(ownedCharacter);
  console.log(`[MEMORY] Created new owned character: user=${userId}, char=${characterId}, ownedId=${ownedCharacter.id}`);
  return ownedCharacter;
}
