#!/usr/bin/env node

/**
 * Script para resetar o estado de migrations quando há conflitos.
 * 
 * Uso:
 * node scripts/reset-migrations.mjs
 * 
 * Este script limpa a tabela drizzle.__drizzle_migrations para forçar
 * que as migrations sejam re-aplicadas, mas usa CREATE IF NOT EXISTS
 * para evitar erros em tipos/tabelas que já existem.
 */

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

async function resetMigrations() {
  const client = await pool.connect();
  
  try {
    console.log("🔄 Limpando tabela de migrations...\n");
    
    // Cria schema drizzle se não existir
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS drizzle;
    `);
    
    // Limpa a tabela de migrations
    await client.query(`
      DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
    `);
    
    console.log("✅ Tabela de migrations limpa!");
    console.log("\n📝 Agora você pode rodar:");
    console.log("   pnpm --filter @workspace/db run migrate\n");
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetMigrations();
