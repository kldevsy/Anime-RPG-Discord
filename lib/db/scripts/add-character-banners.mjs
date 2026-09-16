#!/usr/bin/env node
/**
 * Script para adicionar banners a personagens existentes
 * 
 * Uso: node add-character-banners.mjs
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { characters } from "../src/schema/index.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida!");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

// Exemplos de banners para alguns personagens populares
const bannerUpdates = [
  {
    anime: "Naruto",
    name: "Naruto Uzumaki",
    bannerUrl: "https://images4.alphacoders.com/133/1338244.png", // Banner Naruto
  },
  {
    anime: "Bleach",
    name: "Ichigo Kurosaki",
    bannerUrl: "https://images.alphacoders.com/134/1341770.png", // Banner Ichigo
  },
  {
    anime: "One Piece",
    name: "Monkey D. Luffy",
    bannerUrl: "https://images3.alphacoders.com/135/1357041.png", // Banner Luffy
  },
  {
    anime: "Demon Slayer",
    name: "Tanjiro Kamado",
    bannerUrl: "https://images7.alphacoders.com/108/1089729.png", // Banner Tanjiro
  },
  {
    anime: "Jujutsu Kaisen",
    name: "Satoru Gojo",
    bannerUrl: "https://images8.alphacoders.com/125/1259016.png", // Banner Gojo
  },
  // Adicione mais personagens conforme necessário
];

async function addBanners() {
  console.log("🎨 Adicionando banners aos personagens...\n");
  
  let updated = 0;
  let notFound = 0;
  
  for (const { anime, name, bannerUrl } of bannerUpdates) {
    try {
      const result = await db
        .update(characters)
        .set({ bannerUrl })
        .where(and(
          eq(characters.anime, anime),
          eq(characters.name, name)
        ))
        .returning({ id: characters.id, name: characters.name });
      
      if (result.length > 0) {
        console.log(`✅ ${anime} - ${name}: Banner adicionado`);
        updated++;
      } else {
        console.log(`⚠️  ${anime} - ${name}: Personagem não encontrado`);
        notFound++;
      }
    } catch (error) {
      console.error(`❌ Erro ao atualizar ${anime} - ${name}:`, error.message);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Resumo:`);
  console.log(`  ✅ Atualizados: ${updated}`);
  console.log(`  ⚠️  Não encontrados: ${notFound}`);
  console.log(`  📝 Total processados: ${bannerUpdates.length}`);
  console.log("=".repeat(50) + "\n");
}

async function main() {
  try {
    await addBanners();
    console.log("✅ Banners adicionados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao executar script:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
