import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

try {
  const db = drizzle(pool);
  const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

  await migrate(db, { migrationsFolder });
  process.stdout.write("[db-migrate] Migrations applied successfully.\n");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  process.stderr.write(`[db-migrate] Migration failed: ${message}\n`);
  if (stack) {
    process.stderr.write(`${stack}\n`);
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}