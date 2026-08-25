import { and, asc, eq, inArray } from "drizzle-orm";
import { db, economyTransactions, inventory, quests, userQuests, users, type Quest, type UserQuest } from "@workspace/db";
import { getOrCreateUser } from "./PhaseOneService";
import { processTransaction } from "./EconomyService";

export class QuestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestError";
  }
}

export interface DefaultQuest {
  id: string;
  title: string;
  description: string;
  category: "daily" | "weekly" | "monthly" | "story" | "event";
  requirementType: "battle_win" | "summon" | "pve_clear" | "level_up";
  requirementCount: number;
  rewardGold: number;
  rewardGems: number;
  rewardTickets: number;
  rewardItems: Array<{ itemKey: string; quantity: number }>;
  active: number;
  createdAt: Date;
}

export const defaultQuestsList: DefaultQuest[] = [
  {
    id: "q1000000-0000-4000-8000-000000000001",
    title: "Primeira Batalha",
    description: "Vença 1 batalha em qualquer modo.",
    category: "daily",
    requirementType: "battle_win",
    requirementCount: 1,
    rewardGold: 100,
    rewardGems: 10,
    rewardTickets: 1,
    rewardItems: [{ itemKey: "xp_potion", quantity: 2 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q1000000-0000-4000-8000-000000000002",
    title: "Invocador Iniciante",
    description: "Realize 1 invocação de personagem.",
    category: "daily",
    requirementType: "summon",
    requirementCount: 1,
    rewardGold: 150,
    rewardGems: 20,
    rewardTickets: 0,
    rewardItems: [],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q1000000-0000-4000-8000-000000000003",
    title: "Conquistador do PvE",
    description: "Conclua 3 fases no modo PvE.",
    category: "weekly",
    requirementType: "pve_clear",
    requirementCount: 3,
    rewardGold: 500,
    rewardGems: 100,
    rewardTickets: 3,
    rewardItems: [{ itemKey: "rare_chest", quantity: 1 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
];

const memoryUserQuests: UserQuest[] = [];

export async function getUserQuests(discordId: string, category?: "daily" | "weekly" | "monthly" | "story" | "event") {
  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) return [];

    let availableQuests = defaultQuestsList.filter((q) => q.active === 1);
    if (category) {
      availableQuests = availableQuests.filter((q) => q.category === category);
    }

    return availableQuests.map((quest) => {
      let uq = memoryUserQuests.find((item) => item.userId === user.id && item.questId === quest.id);
      if (!uq) {
        uq = {
          id: crypto.randomUUID(),
          userId: user.id,
          questId: quest.id,
          progress: 0,
          completed: 0,
          claimedAt: null,
          updatedAt: new Date(),
        };
        memoryUserQuests.push(uq);
      }
      return { quest, userQuest: uq };
    });
  }

  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return [];

  const conditions = [eq(quests.active, 1)];
  if (category) {
    conditions.push(eq(quests.category, category));
  }

  const activeQuests = await database.select().from(quests).where(and(...conditions)).orderBy(asc(quests.createdAt));

  const existingUserQuests = await database
    .select()
    .from(userQuests)
    .where(eq(userQuests.userId, user.id));

  const results = [];
  for (const quest of activeQuests) {
    let uq = existingUserQuests.find((item) => item.questId === quest.id);
    if (!uq) {
      const [inserted] = await database
        .insert(userQuests)
        .values({ userId: user.id, questId: quest.id, progress: 0, completed: 0 })
        .onConflictDoNothing()
        .returning();
      if (inserted) uq = inserted;
      else {
        uq = await database.query.userQuests.findFirst({
          where: and(eq(userQuests.userId, user.id), eq(userQuests.questId, quest.id)),
        });
      }
    }
    if (uq) results.push({ quest, userQuest: uq });
  }

  return results;
}

export async function updateQuestProgress(discordId: string, requirementType: string, amount = 1) {
  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) return [];

    const relevantQuests = defaultQuestsList.filter((q) => q.active === 1 && q.requirementType === requirementType);
    const updated = [];

    for (const quest of relevantQuests) {
      let uq = memoryUserQuests.find((item) => item.userId === user.id && item.questId === quest.id);
      if (!uq) {
        uq = {
          id: crypto.randomUUID(),
          userId: user.id,
          questId: quest.id,
          progress: 0,
          completed: 0,
          claimedAt: null,
          updatedAt: new Date(),
        };
        memoryUserQuests.push(uq);
      }

      if (uq.completed === 0) {
        uq.progress += amount;
        if (uq.progress >= quest.requirementCount) {
          uq.progress = quest.requirementCount;
          uq.completed = 1;
        }
        uq.updatedAt = new Date();
        updated.push({ quest, userQuest: uq });
      }
    }
    return updated;
  }

  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return [];

  const relevantQuests = await database
    .select()
    .from(quests)
    .where(and(eq(quests.active, 1), eq(quests.requirementType, requirementType)));

  const updated = [];
  for (const quest of relevantQuests) {
    let uq = await database.query.userQuests.findFirst({
      where: and(eq(userQuests.userId, user.id), eq(userQuests.questId, quest.id)),
    });

    if (!uq) {
      const [inserted] = await database
        .insert(userQuests)
        .values({ userId: user.id, questId: quest.id, progress: 0, completed: 0 })
        .returning();
      uq = inserted;
    }

    if (uq && uq.completed === 0) {
      const newProgress = uq.progress + amount;
      const isCompleted = newProgress >= quest.requirementCount ? 1 : 0;
      const finalProgress = isCompleted === 1 ? quest.requirementCount : newProgress;

      const [newUq] = await database
        .update(userQuests)
        .set({ progress: finalProgress, completed: isCompleted, updatedAt: new Date() })
        .where(eq(userQuests.id, uq.id))
        .returning();

      updated.push({ quest, userQuest: newUq });
    }
  }

  return updated;
}

export async function claimQuestReward(discordId: string, questId: string, idempotencyKey: string) {
  const referenceId = `quest_claim:${idempotencyKey}`;

  if (!db) {
    const user = await getOrCreateUser(discordId, discordId);
    if (!user) throw new QuestError("User not found.");

    const quest = defaultQuestsList.find((q) => q.id === questId);
    if (!quest) throw new QuestError("Quest not found.");

    let uq = memoryUserQuests.find((item) => item.userId === user.id && item.questId === questId);
    if (!uq) throw new QuestError("Quest progress not found.");
    if (uq.completed === 0) throw new QuestError("Quest is not completed yet.");
    if (uq.claimedAt !== null) throw new QuestError("Quest reward already claimed.");

    uq.claimedAt = new Date();
    uq.updatedAt = new Date();

    await processTransaction({
      discordId,
      gold: quest.rewardGold,
      gems: quest.rewardGems,
      tickets: quest.rewardTickets,
      type: "reward",
      source: "quest",
      referenceId,
    });

    return { quest, userQuest: uq, rewards: { gold: quest.rewardGold, gems: quest.rewardGems, tickets: quest.rewardTickets, items: quest.rewardItems } };
  }

  const database = db;
  return database.transaction(async (tx) => {
    const existingTx = await tx.query.economyTransactions.findFirst({
      where: eq(economyTransactions.referenceId, referenceId),
    });
    if (existingTx) {
      throw new QuestError("Quest reward already processed with this idempotency key.");
    }

    const user = await tx.query.users.findFirst({ where: eq(users.discordId, discordId) });
    if (!user) throw new QuestError("User not found.");

    const quest = await tx.query.quests.findFirst({ where: eq(quests.id, questId) });
    if (!quest) throw new QuestError("Quest not found.");

    const uq = await tx.query.userQuests.findFirst({
      where: and(eq(userQuests.userId, user.id), eq(userQuests.questId, quest.id)),
    });

    if (!uq) throw new QuestError("Quest progress not found.");
    if (uq.completed === 0) throw new QuestError("Quest is not completed yet.");
    if (uq.claimedAt !== null) throw new QuestError("Quest reward already claimed.");

    const [updatedUq] = await tx
      .update(userQuests)
      .set({ claimedAt: new Date(), updatedAt: new Date() })
      .where(eq(userQuests.id, uq.id))
      .returning();

    // Give currencies
    await tx
      .update(users)
      .set({
        gold: user.gold + quest.rewardGold,
        gems: user.gems + quest.rewardGems,
        tickets: user.tickets + quest.rewardTickets,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Record economy transaction
    await tx.insert(economyTransactions).values({
      userId: user.id,
      currency: "gold",
      amount: quest.rewardGold,
      type: "reward",
      source: "quest",
      referenceId,
    });

    // Give items
    const items = (quest.rewardItems as Array<{ itemKey: string; quantity: number }>) || [];
    for (const item of items) {
      const existingInv = await tx.query.inventory.findFirst({
        where: and(eq(inventory.userId, user.id), eq(inventory.itemKey, item.itemKey)),
      });
      if (existingInv) {
        await tx
          .update(inventory)
          .set({ quantity: existingInv.quantity + item.quantity, updatedAt: new Date() })
          .where(eq(inventory.id, existingInv.id));
      } else {
        await tx.insert(inventory).values({
          userId: user.id,
          itemKey: item.itemKey,
          quantity: item.quantity,
        });
      }
    }

    return {
      quest,
      userQuest: updatedUq,
      rewards: {
        gold: quest.rewardGold,
        gems: quest.rewardGems,
        tickets: quest.rewardTickets,
        items,
      },
    };
  });
}
