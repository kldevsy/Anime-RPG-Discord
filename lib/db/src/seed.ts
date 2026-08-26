import { pool } from "./index";
import { syncCharacterCatalog } from "./catalog-sync";

if (!pool) throw new Error("DATABASE_URL must be set before running the seed.");

await syncCharacterCatalog();
await pool?.end();
