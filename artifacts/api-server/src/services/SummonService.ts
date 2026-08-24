import { and, asc, eq, inArray } from "drizzle-orm";
import { bannerPity, banners, characters, economyTransactions, summons, userCharacters, users } from "@workspace/db";
import { db } from "@workspace/db";
import { pickWeighted } from "./RandomService";

const rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
type Rarity = typeof rarities[number];

export class SummonError extends Error {}

function requireDb() {
  if (!db) throw new SummonError("PostgreSQL is required for summoning. Enable USE_DATABASE=true.");
  return db;
}

function chooseRarity(rates: Record<string, number>, pity: number, softPityStart: number, hardPity: number): Rarity {
  if (pity + 1 >= hardPity) return "mythic";
  const adjusted = { ...rates };
  if (pity + 1 >= softPityStart) adjusted.legendary = (adjusted.legendary ?? 0) + (pity + 1 - softPityStart + 1) * 2;
  return pickWeighted(rarities.map((rarity) => ({ item: rarity, weight: adjusted[rarity] ?? 0 })));
}

export async function listActiveBanners() {
  const database = requireDb();
  return database.select().from(banners).where(eq(banners.active, 1)).orderBy(asc(banners.createdAt));
}

export async function summon(discordId: string, bannerId: string, quantity: 1 | 10, idempotencyKey: string) {
  const database = requireDb();
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