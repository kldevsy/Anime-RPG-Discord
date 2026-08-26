#!/usr/bin/env node

/**
 * Script para resetar COMPLETAMENTE o banco de dados.
 * 
 * CUIDADO: Este script APAGA TODOS OS DADOS!
 * 
 * Uso:
 * node scripts/reset-database.mjs
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

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log("🔥 RESETANDO BANCO DE DADOS COMPLETAMENTE...\n");
    console.log("⚠️  TODOS OS DADOS SERÃO PERDIDOS!\n");
    
    // Drop todos os tipos enum
    console.log("🗑️  Removendo tipos enum...");
    
    // Primeiro, pega todos os tipos enum customizados
    const enumTypesResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    for (const row of enumTypesResult.rows) {
      console.log(`   - Removendo tipo: ${row.typname}`);
      await client.query(`DROP TYPE IF EXISTS ${row.typname} CASCADE;`);
    }
    
    // Drop todas as tabelas dinamicamente
    console.log("🗑️  Removendo todas as tabelas...");
    
    // Pega todas as tabelas do schema public
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    for (const row of tablesResult.rows) {
      console.log(`   - Removendo tabela: ${row.tablename}`);
      await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
    }
    
    // Limpa a tabela de migrations
    console.log("🗑️  Removendo migrations...");
    await client.query(`
      DROP SCHEMA IF EXISTS drizzle CASCADE;
    `);
    
    console.log("\n✅ Banco de dados resetado com sucesso!");
    console.log("\n📝 Agora rode:");
    console.log("   cd lib/db");
    console.log("   pnpm run migrate");
    console.log("   pnpm run seed\n");
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
