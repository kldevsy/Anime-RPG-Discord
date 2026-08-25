import { and, asc, desc, eq } from "drizzle-orm";
import { bannerPity, banners, characters, economyTransactions, summons, userCharacters, users } from "@workspace/db";
import { db } from "@workspace/db";
import { pickWeighted } from "./RandomService";
import { addOwnedCharacterMemory, getOrCreateUser, memoryCharacters } from "./PhaseOneService";

const rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
type Rarity = typeof rarities[number];

export class SummonError extends Error {}

export interface MemoryBanner {
  id: string;
  name: string;
  type: "normal" | "limited" | "event";
  costCurrency: "gold" | "gems" | "tickets";
  singleCost: number;
  tenCost: number;
  rates: Record<string, number>;
  softPityStart: number;
  hardPity: number;
  active: number;
  createdAt: Date;
}

const memoryBanners: MemoryBanner[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Banner Comum de Invocacao",
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
    id: "00000000-0000-4000-8000-000000000102",
    name: "Banner Limitado: Lendas de Anime",
    type: "limited",
    costCurrency: "gems",
    singleCost: 100,
    tenCost: 900,
    rates: { common: 30, uncommon: 35, rare: 20, epic: 10, legendary: 4, mythic: 1 },
    softPityStart: 70,
    hardPity: 90,
    active: 1,
    createdAt: new Date("2026-01-02"),
  },
];

const memorySummons: Array<{
  id: string;
  idempotencyKey: string;
  userId: string;
  bannerId: string;
  quantity: number;
  results: Array<{ characterId: string; rarity: string }>;
  currency: string;
  cost: number;
  createdAt: Date;
}> = [];

const memoryPityMap = new Map<string, number>();

function chooseRarity(rates: Record<string, number>, pity: number, softPityStart: number, hardPity: number): Rarity {
  if (pity + 1 >= hardPity) return "mythic";
  const adjusted = { ...rates };
  if (pity + 1 >= softPityStart) adjusted.legendary = (adjusted.legendary ?? 0) + (pity + 1 - softPityStart + 1) * 2;
  return pickWeighted(rarities.map((rarity) => ({ item: rarity, weight: adjusted[rarity] ?? 0 })));
}

export async function listActiveBanners() {
  if (!db) {
    return memoryBanners.filter((b) => b.active === 1);
  }
  return db.select().from(banners).where(eq(banners.active, 1)).orderBy(asc(banners.createdAt));
}

export async function getSummonHistory(discordId: string) {
  if (!db) {
    const user = await getOrCreateUser(discordId, "Player");
    return memorySummons.filter((s) => s.userId === user.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  const user = await db.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return [];
  return db.select().from(summons).where(eq(summons.userId, user.id)).orderBy(desc(summons.createdAt));
}

export async function summon(discordId: string, bannerId: string, quantity: 1 | 10, idempotencyKey: string) {
  if (!db) {
    const previous = memorySummons.find((s) => s.idempotencyKey === idempotencyKey);
    if (previous) return previous;

    const user = await getOrCreateUser(discordId, "Player");
    const banner = memoryBanners.find((b) => b.id === bannerId && b.active === 1);
    if (!banner) throw new SummonError("User or active banner not found.");

    const cost = quantity === 10 ? banner.tenCost : banner.singleCost;
    const balance = user[banner.costCurrency];
    if (balance < cost) throw new SummonError(`Insufficient ${banner.costCurrency}.`);

    const pityKey = `${user.id}:${banner.id}`;
    let pity = memoryPityMap.get(pityKey) ?? 0;

    const results: Array<{ characterId: string; rarity: string }> = [];

    for (let index = 0; index < quantity; index += 1) {
      const rarity = chooseRarity(banner.rates, pity, banner.softPityStart, banner.hardPity);
      const pool = memoryCharacters.filter((c) => c.rarity === rarity);
      const character = pool.length ? pool[Math.floor(Math.random() * pool.length)] : memoryCharacters[0];
      results.push({ characterId: character.id, rarity });

      addOwnedCharacterMemory(user.id, character.id);

      if (rarity === "mythic" || rarity === "legendary") pity = 0;
      else pity += 1;
    }

    memoryPityMap.set(pityKey, pity);
    user[banner.costCurrency] -= cost;

    const record = {
      id: crypto.randomUUID(),
      idempotencyKey,
      userId: user.id,
      bannerId: banner.id,
      quantity,
      results,
      currency: banner.costCurrency,
      cost,
      createdAt: new Date(),
    };
    memorySummons.push(record);
    return record;
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
      if (!pool.length) throw new SummonError(`No characters configured for rarity ${rarity}.`);
      const character = pool[Math.floor(Math.random() * pool.length)];
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
