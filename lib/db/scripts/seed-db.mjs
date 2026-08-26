#!/usr/bin/env node

/**
 * Script de seed que popula o banco com dados iniciais
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { characters } from "../src/schema.ts";
import { characterCatalog } from "../src/data/characters.ts";
import { eq } from "drizzle-orm";

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

async function seedDatabase() {
  const db = drizzle(pool);
  
  try {
    console.log("🌱 Populando banco de dados...\n");
    
    console.log(`📝 Sincronizando ${characterCatalog.length} personagens do catálogo...`);
    
    let inserted = 0;
    let updated = 0;
    
    for (const character of characterCatalog) {
      const existing = await db.select().from(characters).where(eq(characters.id, character.id)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(characters).values(character);
        inserted++;
        console.log(`   ✅ Inserido: ${character.name} (${character.anime})`);
      } else {
        await db.update(characters).set(character).where(eq(characters.id, character.id));
        updated++;
        console.log(`   🔄 Atualizado: ${character.name} (${character.anime})`);
      }
    }
    
    console.log(`\n✅ Seed concluído com sucesso!`);
    console.log(`   📊 ${inserted} personagens inseridos`);
    console.log(`   📊 ${updated} personagens atualizados\n`);
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
