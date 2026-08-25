import type { Character, User, UserCharacter } from "@workspace/db";

export const memoryCharacters: Character[] = [
  { id: "00000000-0000-4000-8000-000000000001", anime: "Naruto", name: "Naruto Uzumaki", rarity: "rare", role: "dps", level: 1, baseHp: 920, baseAttack: 180, baseDefense: 105, baseSpeed: 118, imageUrl: null, passive: "Determinação", evolution: null, createdAt: new Date("2026-01-01") },
  { id: "00000000-0000-4000-8000-000000000002", anime: "Naruto", name: "Sakura Haruno", rarity: "uncommon", role: "healer", level: 1, baseHp: 880, baseAttack: 120, baseDefense: 115, baseSpeed: 100, imageUrl: null, passive: "Controle de chakra", evolution: null, createdAt: new Date("2026-01-02") },
  { id: "00000000-0000-4000-8000-000000000003", anime: "One Piece", name: "Monkey D. Luffy", rarity: "epic", role: "tank", level: 1, baseHp: 1250, baseAttack: 165, baseDefense: 135, baseSpeed: 96, imageUrl: null, passive: "Resiliência", evolution: null, createdAt: new Date("2026-01-03") },
  { id: "00000000-0000-4000-8000-000000000004", anime: "Bleach", name: "Ichigo Kurosaki", rarity: "legendary", role: "dps", level: 1, baseHp: 1080, baseAttack: 230, baseDefense: 110, baseSpeed: 125, imageUrl: null, passive: "Pressão espiritual", evolution: null, createdAt: new Date("2026-01-04") },
  { id: "00000000-0000-4000-8000-000000000005", anime: "Dragon Ball", name: "Goku", rarity: "mythic", role: "dps", level: 1, baseHp: 1400, baseAttack: 280, baseDefense: 145, baseSpeed: 130, imageUrl: null, passive: "Instinto de batalha", evolution: null, createdAt: new Date("2026-01-05") },
  { id: "00000000-0000-4000-8000-000000000006", anime: "Naruto", name: "Sasuke Uchiha", rarity: "epic", role: "dps", level: 1, baseHp: 1050, baseAttack: 220, baseDefense: 112, baseSpeed: 122, imageUrl: null, passive: "Sharingan", evolution: null, createdAt: new Date("2026-01-06") },
  { id: "00000000-0000-4000-8000-000000000007", anime: "One Piece", name: "Roronoa Zoro", rarity: "rare", role: "dps", level: 1, baseHp: 1100, baseAttack: 195, baseDefense: 120, baseSpeed: 110, imageUrl: null, passive: "Santoryu", evolution: null, createdAt: new Date("2026-01-07") },
  { id: "00000000-0000-4000-8000-000000000008", anime: "Demon Slayer", name: "Tanjiro Kamado", rarity: "uncommon", role: "dps", level: 1, baseHp: 950, baseAttack: 160, baseDefense: 110, baseSpeed: 112, imageUrl: null, passive: "Respiração da Água", evolution: null, createdAt: new Date("2026-01-08") },
  { id: "00000000-0000-4000-8000-000000000009", anime: "Jujutsu Kaisen", name: "Yuji Itadori", rarity: "common", role: "dps", level: 1, baseHp: 850, baseAttack: 140, baseDefense: 100, baseSpeed: 105, imageUrl: null, passive: "Força Sobre-humana", evolution: null, createdAt: new Date("2026-01-09") },
];

export const memoryUsers: User[] = [];
export const memoryOwned: UserCharacter[] = [];

export function findMemoryUserByDiscordId(discordId: string) {
  return memoryUsers.find((user) => user.discordId === discordId);
}

export function createMemoryUser(discordId: string, username: string) {
  const now = new Date();
  const user: User = { id: crypto.randomUUID(), discordId, username, gold: 0, gems: 1000, tickets: 10, createdAt: now, updatedAt: now };
  memoryUsers.push(user);
  memoryCharacters.slice(0, 3).forEach((character) => getOrCreateMemoryOwnedCharacter(user.id, character.id, now));
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
