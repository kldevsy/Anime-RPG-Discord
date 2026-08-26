import { pool } from "./index.js";
import { syncCharacterCatalog } from "./catalog-sync.js";

if (!pool) throw new Error("DATABASE_URL must be set before running the seed.");

await syncCharacterCatalog();
await pool?.end();
