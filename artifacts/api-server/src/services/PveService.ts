import { and, asc, eq, SQL } from "drizzle-orm";
import { pveStages, pveWorlds, userPveProgress, users } from "@workspace/db";
import { db } from "@workspace/db";

export class PveServiceError extends Error {}

export interface PveWorld {
  id: string;
  name: string;
  description: string;
  position: number;
  active: number;
}

export interface PveStageDrop {
  itemKey: string;
  quantity: number;
  chance: number;
}

export interface PveStage {
  id: string;
  worldId: string;
  name: string;
  type: "story" | "dungeon" | "boss" | "tower" | "event" | "raid";
  position: number;
  enemyName: string;
  enemyHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemySpeed: number;
  bossPhases: number;
  enrageRound: number;
  drops: PveStageDrop[];
  rewardGold: number;
  rewardXp: number;
  active: number;
}

export const MEMORY_WORLDS: PveWorld[] = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Mundo 1: País das Ondas", description: "A primeira aventura no mundo dos ninjas.", position: 1, active: 1 },
  { id: "10000000-0000-4000-8000-000000000002", name: "Mundo 2: Grand Line", description: "A perigosa rota dos piratas.", position: 2, active: 1 },
  { id: "10000000-0000-4000-8000-000000000003", name: "Masmorra Elemental", description: "Cavernas cheias de monstros e tesouros.", position: 3, active: 1 },
  { id: "10000000-0000-4000-8000-000000000004", name: "Torre do Desafio", description: "Andares infinitos para testar sua força.", position: 4, active: 1 },
  { id: "10000000-0000-4000-8000-000000000005", name: "Raid de Chefes", description: "Inimigos lendários de poder extremo.", position: 5, active: 1 },
  { id: "10000000-0000-4000-8000-000000000006", name: "Invasão de Evento", description: "Eventos temporários com recompensas exclusivas.", position: 6, active: 1 },
];

export const MEMORY_STAGES: PveStage[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    worldId: "10000000-0000-4000-8000-000000000001",
    name: "Fronteira das Ondas",
    type: "story",
    position: 1,
    enemyName: "Bandido das Sombras",
    enemyHp: 400,
    enemyAttack: 80,
    enemyDefense: 40,
    enemySpeed: 90,
    bossPhases: 1,
    enrageRound: 10,
    drops: [],
    rewardGold: 100,
    rewardXp: 50,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    worldId: "10000000-0000-4000-8000-000000000001",
    name: "Estrada da Floresta",
    type: "story",
    position: 2,
    enemyName: "Ninjutsu Rogue",
    enemyHp: 650,
    enemyAttack: 110,
    enemyDefense: 60,
    enemySpeed: 100,
    bossPhases: 1,
    enrageRound: 10,
    drops: [],
    rewardGold: 150,
    rewardXp: 80,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    worldId: "10000000-0000-4000-8000-000000000001",
    name: "Confronto na Ponte (Boss)",
    type: "boss",
    position: 3,
    enemyName: "Zabuza Demon",
    enemyHp: 1800,
    enemyAttack: 170,
    enemyDefense: 85,
    enemySpeed: 115,
    bossPhases: 2,
    enrageRound: 8,
    drops: [{ itemKey: "gems", quantity: 50, chance: 100 }],
    rewardGold: 500,
    rewardXp: 300,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    worldId: "10000000-0000-4000-8000-000000000002",
    name: "Vila dos Conchas",
    type: "story",
    position: 1,
    enemyName: "Marinheiro Corrupto",
    enemyHp: 800,
    enemyAttack: 120,
    enemyDefense: 70,
    enemySpeed: 95,
    bossPhases: 1,
    enrageRound: 10,
    drops: [],
    rewardGold: 200,
    rewardXp: 100,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    worldId: "10000000-0000-4000-8000-000000000002",
    name: "Parque Arlong (Boss)",
    type: "boss",
    position: 2,
    enemyName: "Arlong dos Homens-Peixe",
    enemyHp: 3200,
    enemyAttack: 220,
    enemyDefense: 110,
    enemySpeed: 105,
    bossPhases: 2,
    enrageRound: 10,
    drops: [{ itemKey: "tickets", quantity: 2, chance: 100 }],
    rewardGold: 800,
    rewardXp: 500,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    worldId: "10000000-0000-4000-8000-000000000003",
    name: "Caverna Elemental",
    type: "dungeon",
    position: 1,
    enemyName: "Dragão de Pedra",
    enemyHp: 4000,
    enemyAttack: 240,
    enemyDefense: 130,
    enemySpeed: 100,
    bossPhases: 2,
    enrageRound: 8,
    drops: [{ itemKey: "gems", quantity: 80, chance: 100 }],
    rewardGold: 1000,
    rewardXp: 600,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    worldId: "10000000-0000-4000-8000-000000000004",
    name: "Torre Andar 10",
    type: "tower",
    position: 1,
    enemyName: "Golem de Energia",
    enemyHp: 2800,
    enemyAttack: 200,
    enemyDefense: 120,
    enemySpeed: 100,
    bossPhases: 1,
    enrageRound: 10,
    drops: [{ itemKey: "gems", quantity: 30, chance: 100 }],
    rewardGold: 700,
    rewardXp: 450,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    worldId: "10000000-0000-4000-8000-000000000005",
    name: "Raid: Kurama",
    type: "raid",
    position: 1,
    enemyName: "Kurama Nove Caudas",
    enemyHp: 9000,
    enemyAttack: 340,
    enemyDefense: 160,
    enemySpeed: 120,
    bossPhases: 3,
    enrageRound: 6,
    drops: [
      { itemKey: "gems", quantity: 200, chance: 100 },
      { itemKey: "tickets", quantity: 5, chance: 100 },
    ],
    rewardGold: 2500,
    rewardXp: 1500,
    active: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    worldId: "10000000-0000-4000-8000-000000000006",
    name: "Espectro da Primavera",
    type: "event",
    position: 1,
    enemyName: "Espírito de Sakura",
    enemyHp: 1800,
    enemyAttack: 150,
    enemyDefense: 80,
    enemySpeed: 105,
    bossPhases: 1,
    enrageRound: 10,
    drops: [{ itemKey: "tickets", quantity: 1, chance: 100 }],
    rewardGold: 400,
    rewardXp: 250,
    active: 1,
  },
];

const memoryUserProgress: Array<{ userId: string; stageId: string; clearedAt: Date }> = [];

export async function listPveWorlds(): Promise<PveWorld[]> {
  if (!db) return MEMORY_WORLDS.filter((w) => w.active === 1);
  return db.select().from(pveWorlds).where(eq(pveWorlds.active, 1)).orderBy(asc(pveWorlds.position)) as unknown as PveWorld[];
}

export async function listPveStages(filters?: { worldId?: string; type?: string }): Promise<PveStage[]> {
  if (!db) {
    return MEMORY_STAGES.filter((stage) => {
      if (stage.active !== 1) return false;
      if (filters?.worldId && stage.worldId !== filters.worldId) return false;
      if (filters?.type && stage.type !== filters.type) return false;
      return true;
    });
  }
  const conditions: SQL[] = [eq(pveStages.active, 1)];
  if (filters?.worldId) conditions.push(eq(pveStages.worldId, filters.worldId));
  if (filters?.type) conditions.push(eq(pveStages.type, filters.type as unknown as typeof pveStages.type.enumValues[number]));
  return db.select().from(pveStages).where(and(...conditions)).orderBy(asc(pveStages.position)) as unknown as PveStage[];
}

export async function getPveStageById(stageId: string): Promise<PveStage | null> {
  if (!db) {
    return MEMORY_STAGES.find((s) => s.id === stageId && s.active === 1) ?? null;
  }
  const stage = await db.query.pveStages.findFirst({ where: and(eq(pveStages.id, stageId), eq(pveStages.active, 1)) });
  return (stage as unknown as PveStage) ?? null;
}

export async function getUserPveProgress(discordId: string) {
  if (!db) {
    return memoryUserProgress.map((p) => p.stageId);
  }
  const user = await db.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return [];
  const records = await db.select({ stageId: userPveProgress.stageId }).from(userPveProgress).where(eq(userPveProgress.userId, user.id));
  return records.map((r) => r.stageId);
}

export async function recordPveProgress(userId: string, stageId: string) {
  if (!db) {
    const existing = memoryUserProgress.find((p) => p.userId === userId && p.stageId === stageId);
    if (!existing) {
      memoryUserProgress.push({ userId, stageId, clearedAt: new Date() });
    }
    return;
  }
  await db.insert(userPveProgress).values({ userId, stageId }).onConflictDoNothing({ target: [userPveProgress.userId, userPveProgress.stageId] });
}
