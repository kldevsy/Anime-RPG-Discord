import { eq, sql } from "drizzle-orm";
import { characters } from "./schema";
import { db, pool } from "./index";
import { characterCatalog } from "./data/characters";

if (!db) throw new Error("DATABASE_URL must be set before running the seed.");

// `characterCatalog` is authoritative for rows managed by the seed. Characters
// created by the administrative command set `catalogManaged` to false, so a name
// collision cannot silently replace their locally configured values.
await db
  .insert(characters)
  .values(characterCatalog.map((character) => ({ ...character, catalogManaged: true })))
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
    },
    where: eq(characters.catalogManaged, true),
  });
await pool?.end();
