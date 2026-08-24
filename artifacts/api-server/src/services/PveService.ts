import { and, asc, eq } from "drizzle-orm";
import { pveStages, pveWorlds } from "@workspace/db";
import { db } from "@workspace/db";

export class PveServiceError extends Error {}

export async function listPveWorlds() {
  if (!db) throw new PveServiceError("PostgreSQL is required for PvE content.");
  return db.select().from(pveWorlds).where(eq(pveWorlds.active, 1)).orderBy(asc(pveWorlds.position));
}

export async function listPveStages(worldId?: string) {
  if (!db) throw new PveServiceError("PostgreSQL is required for PvE content.");
  return db.select().from(pveStages).where(worldId ? and(eq(pveStages.worldId, worldId), eq(pveStages.active, 1)) : eq(pveStages.active, 1)).orderBy(asc(pveStages.position));
}