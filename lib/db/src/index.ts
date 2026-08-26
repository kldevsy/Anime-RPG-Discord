import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// PostgreSQL is opt-in so local development is usable without a database.
export const databaseConfigured =
  process.env.USE_DATABASE === "true" && Boolean(process.env.DATABASE_URL);
export const pool = databaseConfigured
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
export const db = pool ? drizzle(pool, { schema }) : null;

export * from "./schema";
export * from "./data/characters";
export * from "./catalog-sync";
