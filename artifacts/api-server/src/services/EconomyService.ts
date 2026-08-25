import { and, desc, eq } from "drizzle-orm";
import { db, economyTransactions, users, type User } from "@workspace/db";
import { getOrCreateUser } from "./PhaseOneService";

export class EconomyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EconomyError";
  }
}

export interface MemoryEconomyTransaction {
  id: string;
  userId: string;
  currency: "gold" | "gems" | "tickets";
  amount: number;
  type: string;
  source: string;
  referenceId: string;
  createdAt: Date;
}

const memoryEconomyTransactions: MemoryEconomyTransaction[] = [];

export interface AdjustBalanceParams {
  discordId: string;
  gold?: number;
  gems?: number;
  tickets?: number;
  type: "earn" | "spend" | "reward" | "admin";
  source: string;
  referenceId: string;
}

export async function processTransaction(params: AdjustBalanceParams) {
  const { discordId, gold = 0, gems = 0, tickets = 0, type, source, referenceId } = params;

  if (!db) {
    const existingTx = memoryEconomyTransactions.find((tx) => tx.referenceId === referenceId);
    if (existingTx) {
      const user = await getOrCreateUser(discordId, discordId);
      return { user, transactionProcessed: false, referenceId };
    }

    const user = await getOrCreateUser(discordId, discordId);
    if (!user) throw new EconomyError("User not found.");

    if (user.gold + gold < 0) throw new EconomyError("Insufficient gold balance.");
    if (user.gems + gems < 0) throw new EconomyError("Insufficient gems balance.");
    if (user.tickets + tickets < 0) throw new EconomyError("Insufficient tickets balance.");

    user.gold += gold;
    user.gems += gems;
    user.tickets += tickets;
    user.updatedAt = new Date();

    const now = new Date();
    if (gold !== 0) {
      memoryEconomyTransactions.push({
        id: crypto.randomUUID(),
        userId: user.id,
        currency: "gold",
        amount: gold,
        type,
        source,
        referenceId: `${referenceId}:gold`,
        createdAt: now,
      });
    }
    if (gems !== 0) {
      memoryEconomyTransactions.push({
        id: crypto.randomUUID(),
        userId: user.id,
        currency: "gems",
        amount: gems,
        type,
        source,
        referenceId: `${referenceId}:gems`,
        createdAt: now,
      });
    }
    if (tickets !== 0) {
      memoryEconomyTransactions.push({
        id: crypto.randomUUID(),
        userId: user.id,
        currency: "tickets",
        amount: tickets,
        type,
        source,
        referenceId: `${referenceId}:tickets`,
        createdAt: now,
      });
    }

    // Main marker
    memoryEconomyTransactions.push({
      id: crypto.randomUUID(),
      userId: user.id,
      currency: "gold",
      amount: 0,
      type,
      source,
      referenceId,
      createdAt: now,
    });

    return { user, transactionProcessed: true, referenceId };
  }

  const database = db;
  return database.transaction(async (tx) => {
    const existingTx = await tx.query.economyTransactions.findFirst({
      where: eq(economyTransactions.referenceId, referenceId),
    });

    const user = await tx.query.users.findFirst({ where: eq(users.discordId, discordId) });
    if (!user) throw new EconomyError("User not found.");

    if (existingTx) {
      return { user, transactionProcessed: false, referenceId };
    }

    if (user.gold + gold < 0) throw new EconomyError("Insufficient gold balance.");
    if (user.gems + gems < 0) throw new EconomyError("Insufficient gems balance.");
    if (user.tickets + tickets < 0) throw new EconomyError("Insufficient tickets balance.");

    const newGold = user.gold + gold;
    const newGems = user.gems + gems;
    const newTickets = user.tickets + tickets;

    const [updatedUser] = await tx
      .update(users)
      .set({ gold: newGold, gems: newGems, tickets: newTickets, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    await tx.insert(economyTransactions).values({
      userId: user.id,
      currency: "gold",
      amount: gold,
      type,
      source,
      referenceId,
    });

    return { user: updatedUser, transactionProcessed: true, referenceId };
  });
}

export async function getTransactionHistory(discordId: string, limit = 20) {
  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) return [];
    return memoryEconomyTransactions
      .filter((tx) => tx.userId === user.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return [];

  return database
    .select()
    .from(economyTransactions)
    .where(eq(economyTransactions.userId, user.id))
    .orderBy(desc(economyTransactions.createdAt))
    .limit(limit);
}
