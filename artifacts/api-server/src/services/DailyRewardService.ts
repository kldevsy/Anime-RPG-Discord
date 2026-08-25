import { and, eq } from "drizzle-orm";
import { dailyRewards, db, economyTransactions, inventory, users, type DailyReward } from "@workspace/db";
import { getOrCreateUser } from "./PhaseOneService";
import { processTransaction } from "./EconomyService";

export class DailyRewardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyRewardError";
  }
}

export interface DailyRewardTier {
  day: number;
  gold: number;
  gems: number;
  tickets: number;
  items: Array<{ itemKey: string; quantity: number }>;
}

export const dailyRewardSchedule: DailyRewardTier[] = [
  { day: 1, gold: 500, gems: 50, tickets: 1, items: [{ itemKey: "xp_potion", quantity: 1 }] },
  { day: 2, gold: 1000, gems: 100, tickets: 2, items: [{ itemKey: "xp_potion", quantity: 2 }] },
  { day: 3, gold: 1500, gems: 150, tickets: 3, items: [{ itemKey: "stamina_potion", quantity: 1 }] },
  { day: 4, gold: 2000, gems: 200, tickets: 4, items: [{ itemKey: "stamina_potion", quantity: 2 }] },
  { day: 5, gold: 2500, gems: 250, tickets: 5, items: [{ itemKey: "rare_chest", quantity: 1 }] },
  { day: 6, gold: 3000, gems: 300, tickets: 6, items: [{ itemKey: "rare_chest", quantity: 2 }] },
  { day: 7, gold: 5000, gems: 500, tickets: 10, items: [{ itemKey: "legendary_chest", quantity: 1 }] },
];

const memoryDailyRewards = new Map<string, DailyReward>();

export async function getDailyRewardStatus(discordId: string) {
  const now = new Date();

  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) throw new DailyRewardError("User not found.");

    let record = memoryDailyRewards.get(user.id);
    if (!record) {
      return {
        canClaim: true,
        currentStreak: 0,
        nextReward: dailyRewardSchedule[0],
        lastClaimedAt: null,
      };
    }

    const msSinceLast = now.getTime() - record.lastClaimedAt.getTime();
    const hoursSinceLast = msSinceLast / (1000 * 60 * 60);

    const canClaim = hoursSinceLast >= 20;
    const streakReset = hoursSinceLast >= 48;
    const effectiveStreak = streakReset ? 0 : record.streak;
    const nextDayIndex = effectiveStreak % 7;

    return {
      canClaim,
      currentStreak: effectiveStreak,
      nextReward: dailyRewardSchedule[nextDayIndex],
      lastClaimedAt: record.lastClaimedAt,
    };
  }

  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) throw new DailyRewardError("User not found.");

  const record = await database.query.dailyRewards.findFirst({ where: eq(dailyRewards.userId, user.id) });
  if (!record) {
    return {
      canClaim: true,
      currentStreak: 0,
      nextReward: dailyRewardSchedule[0],
      lastClaimedAt: null,
    };
  }

  const msSinceLast = now.getTime() - record.lastClaimedAt.getTime();
  const hoursSinceLast = msSinceLast / (1000 * 60 * 60);

  const canClaim = hoursSinceLast >= 20;
  const streakReset = hoursSinceLast >= 48;
  const effectiveStreak = streakReset ? 0 : record.streak;
  const nextDayIndex = effectiveStreak % 7;

  return {
    canClaim,
    currentStreak: effectiveStreak,
    nextReward: dailyRewardSchedule[nextDayIndex],
    lastClaimedAt: record.lastClaimedAt,
  };
}

export async function claimDailyReward(discordId: string, idempotencyKey: string) {
  const referenceId = `daily_reward:${idempotencyKey}`;
  const now = new Date();

  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) throw new DailyRewardError("User not found.");

    let record = memoryDailyRewards.get(user.id);
    let streak = 0;

    if (record) {
      const hoursSinceLast = (now.getTime() - record.lastClaimedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 20) {
        throw new DailyRewardError("Daily reward already claimed today. Please try again later.");
      }
      if (hoursSinceLast >= 48) {
        streak = 0;
      } else {
        streak = record.streak;
      }
    }

    const nextStreak = streak + 1;
    const rewardIndex = (nextStreak - 1) % 7;
    const reward = dailyRewardSchedule[rewardIndex];

    const newRecord: DailyReward = {
      id: record?.id ?? crypto.randomUUID(),
      userId: user.id,
      streak: nextStreak,
      lastClaimedAt: now,
    };
    memoryDailyRewards.set(user.id, newRecord);

    await processTransaction({
      discordId,
      gold: reward.gold,
      gems: reward.gems,
      tickets: reward.tickets,
      type: "reward",
      source: "daily_reward",
      referenceId,
    });

    return { streak: nextStreak, reward, claimedAt: now };
  }

  const database = db;
  return database.transaction(async (tx) => {
    const existingTx = await tx.query.economyTransactions.findFirst({
      where: eq(economyTransactions.referenceId, referenceId),
    });
    if (existingTx) {
      throw new DailyRewardError("Daily reward already claimed with this idempotency key.");
    }

    const user = await tx.query.users.findFirst({ where: eq(users.discordId, discordId) });
    if (!user) throw new DailyRewardError("User not found.");

    const record = await tx.query.dailyRewards.findFirst({ where: eq(dailyRewards.userId, user.id) });
    let streak = 0;

    if (record) {
      const hoursSinceLast = (now.getTime() - record.lastClaimedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 20) {
        throw new DailyRewardError("Daily reward already claimed today. Please try again later.");
      }
      if (hoursSinceLast >= 48) {
        streak = 0;
      } else {
        streak = record.streak;
      }
    }

    const nextStreak = streak + 1;
    const rewardIndex = (nextStreak - 1) % 7;
    const reward = dailyRewardSchedule[rewardIndex];

    if (record) {
      await tx
        .update(dailyRewards)
        .set({ streak: nextStreak, lastClaimedAt: now })
        .where(eq(dailyRewards.id, record.id));
    } else {
      await tx.insert(dailyRewards).values({
        userId: user.id,
        streak: nextStreak,
        lastClaimedAt: now,
      });
    }

    await tx
      .update(users)
      .set({
        gold: user.gold + reward.gold,
        gems: user.gems + reward.gems,
        tickets: user.tickets + reward.tickets,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    await tx.insert(economyTransactions).values({
      userId: user.id,
      currency: "gold",
      amount: reward.gold,
      type: "reward",
      source: "daily_reward",
      referenceId,
    });

    for (const item of reward.items) {
      const existingInv = await tx.query.inventory.findFirst({
        where: and(eq(inventory.userId, user.id), eq(inventory.itemKey, item.itemKey)),
      });
      if (existingInv) {
        await tx
          .update(inventory)
          .set({ quantity: existingInv.quantity + item.quantity, updatedAt: now })
          .where(eq(inventory.id, existingInv.id));
      } else {
        await tx.insert(inventory).values({
          userId: user.id,
          itemKey: item.itemKey,
          quantity: item.quantity,
        });
      }
    }

    return { streak: nextStreak, reward, claimedAt: now };
  });
}
