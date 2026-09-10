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
  // ===== DAILY QUESTS =====
  {
    id: "q1000000-0000-4000-8000-000000000001",
    title: "Guerreiro Diário",
    description: "Vença 3 batalhas em qualquer modo.",
    category: "daily",
    requirementType: "battle_win",
    requirementCount: 3,
    rewardGold: 200,
    rewardGems: 15,
    rewardTickets: 1,
    rewardItems: [{ itemKey: "xp_potion", quantity: 2 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q1000000-0000-4000-8000-000000000002",
    title: "Invocador do Dia",
    description: "Realize 2 invocações de personagem.",
    category: "daily",
    requirementType: "summon",
    requirementCount: 2,
    rewardGold: 150,
    rewardGems: 20,
    rewardTickets: 0,
    rewardItems: [],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q1000000-0000-4000-8000-000000000003",
    title: "Explorador PvE",
    description: "Complete 2 fases no modo PvE.",
    category: "daily",
    requirementType: "pve_clear",
    requirementCount: 2,
    rewardGold: 180,
    rewardGems: 10,
    rewardTickets: 1,
    rewardItems: [],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q1000000-0000-4000-8000-000000000004",
    title: "Caminho do Poder",
    description: "Suba 1 nível com qualquer personagem.",
    category: "daily",
    requirementType: "level_up",
    requirementCount: 1,
    rewardGold: 250,
    rewardGems: 25,
    rewardTickets: 0,
    rewardItems: [{ itemKey: "xp_potion", quantity: 3 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },

  // ===== WEEKLY QUESTS =====
  {
    id: "q2000000-0000-4000-8000-000000000001",
    title: "Veterano da Arena",
    description: "Vença 10 batalhas em qualquer modo.",
    category: "weekly",
    requirementType: "battle_win",
    requirementCount: 10,
    rewardGold: 800,
    rewardGems: 80,
    rewardTickets: 3,
    rewardItems: [{ itemKey: "rare_chest", quantity: 1 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q2000000-0000-4000-8000-000000000002",
    title: "Colecionador Semanal",
    description: "Realize 5 invocações de personagem.",
    category: "weekly",
    requirementType: "summon",
    requirementCount: 5,
    rewardGold: 600,
    rewardGems: 100,
    rewardTickets: 2,
    rewardItems: [],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q2000000-0000-4000-8000-000000000003",
    title: "Mestre do PvE",
    description: "Conclua 10 fases no modo PvE.",
    category: "weekly",
    requirementType: "pve_clear",
    requirementCount: 10,
    rewardGold: 1000,
    rewardGems: 120,
    rewardTickets: 4,
    rewardItems: [{ itemKey: "rare_chest", quantity: 2 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q2000000-0000-4000-8000-000000000004",
    title: "Evolução Constante",
    description: "Suba 5 níveis com seus personagens.",
    category: "weekly",
    requirementType: "level_up",
    requirementCount: 5,
    rewardGold: 700,
    rewardGems: 90,
    rewardTickets: 2,
    rewardItems: [{ itemKey: "xp_potion", quantity: 10 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },

  // ===== STORY QUESTS =====
  {
    id: "q3000000-0000-4000-8000-000000000001",
    title: "O Início da Jornada",
    description: "Vença sua primeira batalha.",
    category: "story",
    requirementType: "battle_win",
    requirementCount: 1,
    rewardGold: 500,
    rewardGems: 50,
    rewardTickets: 3,
    rewardItems: [],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q3000000-0000-4000-8000-000000000002",
    title: "Primeiro Companheiro",
    description: "Realize sua primeira invocação.",
    category: "story",
    requirementType: "summon",
    requirementCount: 1,
    rewardGold: 300,
    rewardGems: 100,
    rewardTickets: 5,
    rewardItems: [],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q3000000-0000-4000-8000-000000000003",
    title: "Explorador Novato",
    description: "Complete sua primeira fase PvE.",
    category: "story",
    requirementType: "pve_clear",
    requirementCount: 1,
    rewardGold: 400,
    rewardGems: 75,
    rewardTickets: 2,
    rewardItems: [{ itemKey: "xp_potion", quantity: 5 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q3000000-0000-4000-8000-000000000004",
    title: "Veterano Invencível",
    description: "Vença 50 batalhas.",
    category: "story",
    requirementType: "battle_win",
    requirementCount: 50,
    rewardGold: 2000,
    rewardGems: 250,
    rewardTickets: 10,
    rewardItems: [{ itemKey: "rare_chest", quantity: 3 }],
    active: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "q3000000-0000-4000-8000-000000000005",
    title: "Colecionador Épico",
    description: "Realize 20 invocações.",
    category: "story",
    requirementType: "summon",
    requirementCount: 20,
    rewardGold: 1500,
    rewardGems: 300,
    rewardTickets: 8,
    rewardItems: [],
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
