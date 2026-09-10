#!/usr/bin/env node

/**
 * Script para popular banners de invocação no banco
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

const BANNERS = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Banner Normal - Invocação Padrão",
    type: "normal",
    singleCost: 1,
    tenCost: 10,
    costCurrency: "tickets",
    softPityStart: 70,
    hardPity: 90,
    rates: JSON.stringify({ common: 0.50, uncommon: 0.30, rare: 0.13, epic: 0.05, legendary: 0.018, mythic: 0.002 }),
    active: 1
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Banner Limitado - Heróis Lendários",
    type: "limited",
    singleCost: 150,
    tenCost: 1350,
    costCurrency: "gems",
    softPityStart: 60,
    hardPity: 80,
    rates: JSON.stringify({ common: 0.40, uncommon: 0.35, rare: 0.15, epic: 0.07, legendary: 0.025, mythic: 0.005 }),
    active: 1
  }
];

async function seedBanners() {
  const client = await pool.connect();
  
  try {
    console.log("🎰 Populando banners de invocação...\n");
    
    for (const banner of BANNERS) {
      await client.query(`
        INSERT INTO banners (
          id, name, type, single_cost, ten_cost, cost_currency,
          soft_pity_start, hard_pity, rates, active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          single_cost = EXCLUDED.single_cost,
          ten_cost = EXCLUDED.ten_cost,
          cost_currency = EXCLUDED.cost_currency,
          soft_pity_start = EXCLUDED.soft_pity_start,
          hard_pity = EXCLUDED.hard_pity,
          rates = EXCLUDED.rates,
          active = EXCLUDED.active
      `, [
        banner.id, banner.name, banner.type, banner.singleCost, banner.tenCost,
        banner.costCurrency, banner.softPityStart, banner.hardPity, banner.rates,
        banner.active
      ]);
      console.log(`   ✅ ${banner.name}`);
    }
    
    console.log(`\n✅ Seed de banners concluído!`);
    console.log(`   📊 ${BANNERS.length} banners inseridos\n`);
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedBanners();
