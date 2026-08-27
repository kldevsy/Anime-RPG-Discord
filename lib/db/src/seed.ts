import { pool } from "./index.ts";
import { syncCharacterCatalog } from "./catalog-sync.ts";

if (!pool) throw new Error("DATABASE_URL must be set before running the seed.");

await syncCharacterCatalog();
await pool?.end();
