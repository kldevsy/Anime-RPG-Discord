import { and, eq } from "drizzle-orm";
import { battles, banners, characters, events, userCharacters } from "@workspace/db";
import { db, type Character } from "@workspace/db";
import { getOrCreateUser } from "./PhaseOneService";
import { processTransaction } from "./EconomyService";
import { memoryCharacters } from "./MemoryStore";

export class AdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminError";
  }
}

export interface AdminCreateCharacterInput {
  anime: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  role: "tank" | "dps" | "support" | "healer" | "control";
  level?: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  imageUrl?: string;
  passive?: string;
}

export interface AdminCreateBannerInput {
  name: string;
  type: "normal" | "limited" | "event";
  costCurrency: "tickets" | "gems" | "gold";
  singleCost: number;
  tenCost: number;
  rates: Record<string, number>;
  softPityStart?: number;
  hardPity?: number;
  active?: number;
}

export interface AdminCreateEventInput {
  name: string;
  description: string;
  enemyName: string;
  enemyHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemySpeed: number;
  rewardGold?: number;
  rewardGems?: number;
  rewardTickets?: number;
  active?: number;
}

export async function adminCreateCharacter(input: AdminCreateCharacterInput) {
  if (!db) {
    const newChar: Character = {
      id: crypto.randomUUID(),
      anime: input.anime,
      name: input.name,
      rarity: input.rarity,
      role: input.role,
      level: input.level ?? 1,
      baseHp: input.baseHp,
      baseAttack: input.baseAttack,
      baseDefense: input.baseDefense,
      baseSpeed: input.baseSpeed,
      imageUrl: input.imageUrl ?? null,
      passive: input.passive ?? null,
      catalogManaged: false,
      ultimate: null,
      evolution: null,
      createdAt: new Date(),
    };
    memoryCharacters.push(newChar);
    return newChar;
  }

  const [created] = await db.insert(characters).values({
    anime: input.anime,
    name: input.name,
    rarity: input.rarity,
    role: input.role,
    level: input.level ?? 1,
    baseHp: input.baseHp,
    baseAttack: input.baseAttack,
    baseDefense: input.baseDefense,
    baseSpeed: input.baseSpeed,
    imageUrl: input.imageUrl ?? null,
    passive: input.passive ?? null,
    catalogManaged: false,
  }).returning();

  return created;
}

export async function adminCreateBanner(input: AdminCreateBannerInput) {
  if (!db) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      costCurrency: input.costCurrency,
      singleCost: input.singleCost,
      tenCost: input.tenCost,
      rates: input.rates,
      softPityStart: input.softPityStart ?? 70,
      hardPity: input.hardPity ?? 90,
      active: input.active ?? 1,
      createdAt: new Date(),
    };
  }

  const [created] = await db.insert(banners).values({
    name: input.name,
    type: input.type,
    costCurrency: input.costCurrency,
    singleCost: input.singleCost,
    tenCost: input.tenCost,
    rates: input.rates,
    softPityStart: input.softPityStart ?? 70,
    hardPity: input.hardPity ?? 90,
    active: input.active ?? 1,
  }).returning();

  return created;
}

export async function adminToggleBanner(bannerId: string, active: number) {
  if (!db) {
    return { bannerId, active };
  }
  const [updated] = await db.update(banners).set({ active }).where(eq(banners.id, bannerId)).returning();
  if (!updated) throw new AdminError("Banner not found.");
  return updated;
}

export async function adminCreateEvent(input: AdminCreateEventInput) {
  if (!db) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      enemyName: input.enemyName,
      enemyHp: input.enemyHp,
      enemyAttack: input.enemyAttack,
      enemyDefense: input.enemyDefense,
      enemySpeed: input.enemySpeed,
      rewardGold: input.rewardGold ?? 0,
      rewardGems: input.rewardGems ?? 0,
      rewardTickets: input.rewardTickets ?? 0,
      active: input.active ?? 1,
      createdAt: new Date(),
    };
  }

  const [created] = await db.insert(events).values({
    name: input.name,
    description: input.description,
    enemyName: input.enemyName,
    enemyHp: input.enemyHp,
    enemyAttack: input.enemyAttack,
    enemyDefense: input.enemyDefense,
    enemySpeed: input.enemySpeed,
    rewardGold: input.rewardGold ?? 0,
    rewardGems: input.rewardGems ?? 0,
    rewardTickets: input.rewardTickets ?? 0,
    active: input.active ?? 1,
  }).returning();

  return created;
}

export async function adminGiveResources(
  discordId: string,
  resources: { gold?: number; gems?: number; tickets?: number; characterId?: string },
) {
  const user = await getOrCreateUser(discordId, discordId);
  if (!user) throw new AdminError("User profile not found.");

  const ref = `admin_give:${discordId}:${Date.now()}`;

  if (resources.gold || resources.gems || resources.tickets) {
    await processTransaction({
      discordId,
      gold: resources.gold ?? 0,
      gems: resources.gems ?? 0,
      tickets: resources.tickets ?? 0,
      type: "admin",
      source: "admin_command",
      referenceId: ref,
    });
  }

  const updatedUser = await getOrCreateUser(discordId, discordId);

  let grantedCharacter = null;
  if (resources.characterId) {
    if (!db) {
      grantedCharacter = {
        id: crypto.randomUUID(),
        userId: user.id,
        characterId: resources.characterId,
        level: 1,
        xp: 0,
        acquiredAt: new Date(),
      };
    } else {
      const [userChar] = await db.insert(userCharacters).values({
        userId: user.id,
        characterId: resources.characterId,
      }).onConflictDoNothing().returning();
      grantedCharacter = userChar ?? null;
    }
  }

  return { user: { ...updatedUser }, grantedCharacter };
}

export async function adminRemoveResources(
  discordId: string,
  resources: { gold?: number; gems?: number; tickets?: number; userCharacterId?: string },
) {
  const user = await getOrCreateUser(discordId, discordId);
  if (!user) throw new AdminError("User profile not found.");

  const ref = `admin_remove:${discordId}:${Date.now()}`;

  const goldDeduct = resources.gold ? -Math.abs(resources.gold) : 0;
  const gemsDeduct = resources.gems ? -Math.abs(resources.gems) : 0;
  const ticketsDeduct = resources.tickets ? -Math.abs(resources.tickets) : 0;

  if (goldDeduct || gemsDeduct || ticketsDeduct) {
    await processTransaction({
      discordId,
      gold: goldDeduct,
      gems: gemsDeduct,
      tickets: ticketsDeduct,
      type: "admin",
      source: "admin_command",
      referenceId: ref,
    });
  }

  const updatedUser = await getOrCreateUser(discordId, discordId);

  let removedCharacter = false;
  if (resources.userCharacterId && db) {
    const deleted = await db.delete(userCharacters)
      .where(and(eq(userCharacters.id, resources.userCharacterId), eq(userCharacters.userId, user.id)))
      .returning();
    removedCharacter = deleted.length > 0;
  } else if (resources.userCharacterId) {
    removedCharacter = true;
  }

  return { user: { ...updatedUser }, removedCharacter };
}

export async function adminClearBattleState(discordId: string) {
  const user = await getOrCreateUser(discordId, discordId);
  if (!user) throw new AdminError("User not found.");

  if (db) {
    await db.update(battles).set({ status: "draw", completedAt: new Date() })
      .where(and(eq(battles.userId, user.id), eq(battles.status, "running")));
  }

  return { user: { ...user }, cleared: true };
}
