import { eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { characterCatalog } from "./data/characters.ts";
import { characters } from "./schema/index.ts";
import { db } from "./index.ts";

/**
 * Calcula hash do catálogo para detectar mudanças
 */
function computeCatalogHash(): string {
  const catalogData = JSON.stringify(characterCatalog);
  return createHash("sha256").update(catalogData).digest("hex");
}

let lastKnownHash: string | null = null;
let lastSyncTime = 0;

/**
 * Verifica se o catálogo mudou desde a última verificação
 */
export function hasCatalogChanged(): boolean {
  const currentHash = computeCatalogHash();
  if (lastKnownHash === null || lastKnownHash !== currentHash) {
    return true;
  }
  return false;
}

/**
 * Mantém o catálogo de banco de dados sincronizado com o catálogo TypeScript editável.
 * 
 * Agora detecta automaticamente mudanças no catálogo através de hash,
 * eliminando necessidade de sincronização manual.
 *
 * Personagens com nomes únicos e `catalogManaged = false` (criados via admin)
 * são preservados. Entradas existentes do catálogo são sincronizadas.
 */
export async function syncCharacterCatalog(options?: { force?: boolean }) {
  if (!db) return { insertedOrUpdated: 0, skipped: true, reason: "no-database" };

  const currentHash = computeCatalogHash();
  const force = options?.force ?? false;

  // Verifica se precisa sincronizar
  if (!force && lastKnownHash === currentHash) {
    const timeSinceSync = Date.now() - lastSyncTime;
    // Permite re-sync manual após 5 minutos
    if (timeSinceSync < 300000) {
      return { insertedOrUpdated: 0, skipped: true, reason: "no-changes" };
    }
  }

  const values = characterCatalog.map((character) => ({
    ...character,
    catalogManaged: true,
  }));

  await db
    .insert(characters)
    .values(values)
    .onConflictDoUpdate({
      target: [characters.anime, characters.name],
      set: {
        rarity: sql`excluded.rarity`,
        role: sql`excluded.role`,
        baseHp: sql`excluded.base_hp`,
        baseAttack: sql`excluded.base_attack`,
        baseDefense: sql`excluded.base_defense`,
        baseSpeed: sql`excluded.base_speed`,
        passive: sql`excluded.passive`,
        imageUrl: sql`excluded.image_url`,
        ultimate: sql`excluded.ultimate`,
        catalogManaged: sql`true`,
      },
    });

  lastKnownHash = currentHash;
  lastSyncTime = Date.now();

  return { 
    insertedOrUpdated: values.length, 
    skipped: false, 
    hash: currentHash,
    reason: force ? "forced" : "changed" 
  };
}