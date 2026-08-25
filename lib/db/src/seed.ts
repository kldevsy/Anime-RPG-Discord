import { sql } from "drizzle-orm";
import { characters } from "./schema";
import { db, pool } from "./index";
import { characterCatalog } from "./data/characters";

if (!db) throw new Error("DATABASE_URL must be set before running the seed.");

await db
  .insert(characters)
  .values(characterCatalog)
  .onConflictDoUpdate({
    target: [characters.anime, characters.name],
    set: {
      imageUrl: sql`excluded.image_url`,
    },
  });
await pool?.end();
