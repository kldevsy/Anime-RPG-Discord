import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

let parsedDatabaseUrl: URL;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error(
    "DATABASE_URL must be the PostgreSQL connection string from Database > Settings",
  );
}

if (
  !["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol) ||
  !parsedDatabaseUrl.hostname
) {
  throw new Error(
    "DATABASE_URL must be a valid PostgreSQL connection string from Database > Settings",
  );
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const migrations = readMigrationFiles({ migrationsFolder });

function isAlreadyExistingObject(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error ? error.code : undefined;
  return code === "42701" || code === "42710" || code === "42P06" || code === "42P07";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

const client = await pool.connect();
let advisoryLockHeld = false;

try {
  // Only one startup process may apply migrations at a time.
  await client.query("SELECT pg_advisory_lock(hashtext('workspace_db_migrations'))");
  advisoryLockHeld = true;
  await client.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const latest = await client.query(
    'SELECT created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at DESC LIMIT 1',
  );
  const lastMigration = latest.rows[0];
  let recoveredObjects = 0;

  for (const migration of migrations) {
    if (lastMigration && Number(lastMigration.created_at) >= migration.folderMillis) {
      continue;
    }

    await client.query("BEGIN");
    try {
      for (const statement of migration.sql) {
        if (!statement.trim()) continue;

        // PostgreSQL aborts the whole transaction after one statement error.
        // A savepoint lets us keep only the duplicate-object recovery local.
        await client.query("SAVEPOINT drizzle_statement");
        try {
          await client.query(statement);
          await client.query("RELEASE SAVEPOINT drizzle_statement");
        } catch (error) {
          if (!isAlreadyExistingObject(error)) throw error;

          await client.query("ROLLBACK TO SAVEPOINT drizzle_statement");
          await client.query("RELEASE SAVEPOINT drizzle_statement");
          recoveredObjects += 1;
          process.stdout.write(
            `[db-migrate] Existing database object kept during ${migration.folderMillis}: ${errorMessage(error)}\n`,
          );
        }
      }

      await client.query(
        'INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)',
        [migration.hash, migration.folderMillis],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(
        `Migration ${migration.folderMillis} failed: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  }

  process.stdout.write("[db-migrate] Migrations are up to date.\n");
  if (recoveredObjects > 0) {
    process.stdout.write(
      `[db-migrate] Continued safely past ${recoveredObjects} existing database object(s).\n`,
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  process.stderr.write(`[db-migrate] Migration failed: ${message}\n`);
  if (stack) {
    process.stderr.write(`${stack}\n`);
  }
  process.exitCode = 1;
} finally {
  if (advisoryLockHeld) {
    await client.query("SELECT pg_advisory_unlock(hashtext('workspace_db_migrations'))");
  }
  client.release();
  await pool.end();
}