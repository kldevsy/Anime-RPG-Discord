import { and, asc, desc, eq } from "drizzle-orm";
import { bannerPity, banners, characters, economyTransactions, inventory, summons, userCharacters, users } from "@workspace/db";
import { db, type Character, type UserCharacter } from "@workspace/db";
import { pickWeighted } from "./RandomService";
import { getOrCreateUser } from "./PhaseOneService";

const rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
type Rarity = typeof rarities[number];

export class SummonError extends Error {}

export interface MemoryBanner {
  id: string;
  name: string;
  type: "normal" | "limited" | "event";
  costCurrency: "tickets" | "gems" | "gold";
  singleCost: number;
  tenCost: number;
  rates: Record<string, number>;
  softPityStart: number;
  hardPity: number;
  active: number;
  createdAt: Date;
}

export interface MemorySummon {
  id: string;
  idempotencyKey: string;
  userId: string;
  bannerId: string;
  quantity: number;
  results: Array<{ characterId: string; rarity: string }>;
  currency: "tickets" | "gems" | "gold";
  cost: number;
  createdAt: Date;
}

export interface MemoryInventoryItem {
  id: string;
  userId: string;
  itemKey: string;
  quantity: number;
  updatedAt: Date;
}

const memoryBanners: MemoryBanner[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Banner Normal - Invocação Padrão",
    type: "normal",
    costCurrency: "tickets",
    singleCost: 1,
    tenCost: 10,
    rates: { common: 50, uncommon: 30, rare: 13, epic: 5, legendary: 1.8, mythic: 0.2 },
    softPityStart: 70,
    hardPity: 90,
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Banner Limitado - Heróis Lendários",
    type: "limited",
    costCurrency: "gems",
    singleCost: 150,
    tenCost: 1500,
    rates: { common: 40, uncommon: 35, rare: 15, epic: 7, legendary: 2.5, mythic: 0.5 },
    softPityStart: 70,
    hardPity: 90,
    active: 1,
    createdAt: new Date("2026-01-02"),
  },
];

const memoryDefaultCharacters: Character[] = [
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

const memorySummons: MemorySummon[] = [];
const memoryPityMap = new Map<string, number>(); // key: `${userId}:${bannerId}`
const memoryUserCharactersMap = new Map<string, UserCharacter[]>(); // userId -> owned
const memoryInventoryMap = new Map<string, MemoryInventoryItem[]>(); // userId -> inventory

function chooseRarity(rates: Record<string, number>, pity: number, softPityStart: number, hardPity: number): Rarity {
  if (pity + 1 >= hardPity) return "mythic";
  const adjusted = { ...rates };
  if (pity + 1 >= softPityStart) {
    adjusted.legendary = (adjusted.legendary ?? 0) + (pity + 1 - softPityStart + 1) * 2;
    adjusted.mythic = (adjusted.mythic ?? 0) + (pity + 1 - softPityStart + 1) * 0.5;
  }
  return pickWeighted(rarities.map((rarity) => ({ item: rarity, weight: adjusted[rarity] ?? 0 })));
}

export async function listActiveBanners() {
  if (!db) {
    return memoryBanners.filter((b) => b.active === 1).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  const database = db;
  return database.select().from(banners).where(eq(banners.active, 1)).orderBy(asc(banners.createdAt));
}

export async function summon(discordId: string, bannerId: string, quantity: 1 | 10, idempotencyKey: string) {
  if (!db) {
    const previous = memorySummons.find((s) => s.idempotencyKey === idempotencyKey);
    if (previous) return previous;

    const user = await getOrCreateUser(discordId, discordId);
    const banner = memoryBanners.find((b) => b.id === bannerId && b.active === 1);
    if (!user || !banner) throw new SummonError("User or active banner not found.");

    const cost = quantity === 10 ? banner.tenCost : banner.singleCost;
    const currency = banner.costCurrency;
    const balance = user[currency];
    if (balance < cost) throw new SummonError(`Insufficient ${currency}.`);

    const pityKey = `${user.id}:${banner.id}`;
    let pity = memoryPityMap.get(pityKey) ?? 0;

    let owned = memoryUserCharactersMap.get(user.id);
    if (!owned) {
      const initialProfile = await getOrCreateUser(discordId, discordId);
      owned = memoryDefaultCharacters.slice(0, 3).map((c) => ({
        id: crypto.randomUUID(),
        userId: initialProfile.id,
        characterId: c.id,
        level: 1,
        xp: 0,
        acquiredAt: new Date(),
      }));
      memoryUserCharactersMap.set(user.id, owned);
    }

    const results: Array<{ characterId: string; rarity: string }> = [];
    for (let i = 0; i < quantity; i += 1) {
      const rarity = chooseRarity(banner.rates ?? {}, pity, banner.softPityStart, banner.hardPity);
      const pool = memoryDefaultCharacters.filter((c) => c.rarity === rarity);
      const fallbackPool = pool.length > 0 ? pool : memoryDefaultCharacters;
      const character = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

      results.push({ characterId: character.id, rarity });
      if (rarity === "mythic" || rarity === "legendary") pity = 0; else pity += 1;

      if (!owned.some((item) => item.characterId === character.id)) {
        owned.push({
          id: crypto.randomUUID(),
          userId: user.id,
          characterId: character.id,
          level: 1,
          xp: 0,
          acquiredAt: new Date(),
        });
      }
    }

    memoryPityMap.set(pityKey, pity);
    user[currency] -= cost;

    // Record inventory tickets/gems usage record or duplicates item update
    const userInv = memoryInventoryMap.get(user.id) ?? [];
    const invItem = userInv.find((item) => item.itemKey === `summon_pity_${banner.id}`);
    if (invItem) {
      invItem.quantity = pity;
      invItem.updatedAt = new Date();
    } else {
      userInv.push({
        id: crypto.randomUUID(),
        userId: user.id,
        itemKey: `summon_pity_${banner.id}`,
        quantity: pity,
        updatedAt: new Date(),
      });
      memoryInventoryMap.set(user.id, userInv);
    }

    const created: MemorySummon = {
      id: crypto.randomUUID(),
      idempotencyKey,
      userId: user.id,
      bannerId: banner.id,
      quantity,
      results,
      currency,
      cost,
      createdAt: new Date(),
    };
    memorySummons.push(created);
    return created;
  }

  const database = db;
  return database.transaction(async (tx) => {
    const previous = await tx.query.summons.findFirst({ where: eq(summons.idempotencyKey, idempotencyKey) });
    if (previous) return previous;
    const user = await tx.query.users.findFirst({ where: eq(users.discordId, discordId) });
    const banner = await tx.query.banners.findFirst({ where: and(eq(banners.id, bannerId), eq(banners.active, 1)) });
    if (!user || !banner) throw new SummonError("User or active banner not found.");
    const cost = quantity === 10 ? banner.tenCost : banner.singleCost;
    const balance = user[banner.costCurrency];
    if (balance < cost) throw new SummonError(`Insufficient ${banner.costCurrency}.`);

    const pityRow = await tx.query.bannerPity.findFirst({ where: and(eq(bannerPity.userId, user.id), eq(bannerPity.bannerId, banner.id)) });
    let pity = pityRow?.count ?? 0;
    const owned = await tx.select({ character: characters, owned: userCharacters })
      .from(userCharacters).innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .where(eq(userCharacters.userId, user.id));
    const results: Array<{ characterId: string; rarity: string }> = [];
    for (let index = 0; index < quantity; index += 1) {
      const rarity = chooseRarity(banner.rates ?? {}, pity, banner.softPityStart, banner.hardPity);
      const pool = await tx.select().from(characters).where(eq(characters.rarity, rarity));
      const fallbackPool = pool.length > 0 ? pool : await tx.select().from(characters);
      if (!fallbackPool.length) throw new SummonError(`No characters configured for rarity ${rarity}.`);
      const character = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      results.push({ characterId: character.id, rarity });
      if (rarity === "mythic" || rarity === "legendary") pity = 0; else pity += 1;
      if (!owned.some((item) => item.character.id === character.id)) {
        await tx.insert(userCharacters).values({ userId: user.id, characterId: character.id }).onConflictDoNothing();
      }
    }
    await tx.insert(bannerPity).values({ userId: user.id, bannerId: banner.id, count: pity })
      .onConflictDoUpdate({ target: [bannerPity.userId, bannerPity.bannerId], set: { count: pity } });
    await tx.update(users).set({ [banner.costCurrency]: balance - cost, updatedAt: new Date() }).where(eq(users.id, user.id));
    const referenceId = `summon:${idempotencyKey}`;
    await tx.insert(economyTransactions).values({ userId: user.id, currency: banner.costCurrency, amount: -cost, type: "spend", source: "summon", referenceId });
    const [created] = await tx.insert(summons).values({ idempotencyKey, userId: user.id, bannerId, quantity, results, currency: banner.costCurrency, cost }).returning();
    return created;
  });
}

export async function getSummonHistory(discordId: string) {
  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) return [];
    return memorySummons
      .filter((s) => s.userId === user.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return [];
  return database.select().from(summons).where(eq(summons.userId, user.id)).orderBy(desc(summons.createdAt));
}

export async function getUserInventory(discordId: string) {
  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) return null;
    const inv = memoryInventoryMap.get(user.id) ?? [];
    return {
      currencies: {
        gold: user.gold,
        gems: user.gems,
        tickets: user.tickets,
      },
      items: inv,
    };
  }
  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return null;
  const inv = await database.select().from(inventory).where(eq(inventory.userId, user.id));
  return {
    currencies: {
      gold: user.gold,
      gems: user.gems,
      tickets: user.tickets,
    },
    items: inv,
  };
}
