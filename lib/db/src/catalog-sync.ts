import { eq, sql } from "drizzle-orm";
import { characterCatalog } from "./data/characters";
import { characters } from "./schema";
import { db } from "./index";

/**
 * Keeps the database catalog in sync with the editable TypeScript catalog.
 *
 * Character names are unique, so an administrative character with a different
 * name is preserved. Existing catalog names are intentionally synchronized as
 * well; this repairs older rows that were created before catalogManaged existed.
 */
export async function syncCharacterCatalog() {
  if (!db) return { insertedOrUpdated: 0, skipped: true };

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

  return { insertedOrUpdated: values.length, skipped: false };
}