#!/usr/bin/env node
/**
 * @fileoverview Seeder para o catálogo de equipamentos
 * Sincroniza os equipamentos definidos em `src/data/equipment.ts` com o banco de dados.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { equipment } from "../src/schema/index.ts";
import { EQUIPMENT_CATALOG } from "../src/data/equipment.ts";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

async function seedEquipment() {
  console.log("🗡️ [EQUIPMENT SYNC] Starting equipment catalog synchronization...");

  try {
    // Buscar equipamentos existentes gerenciados pelo catálogo
    const existing = await db
      .select()
      .from(equipment)
      .where(eq(equipment.catalogManaged, true));

    const existingMap = new Map(existing.map(item => [item.name, item]));

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const item of EQUIPMENT_CATALOG) {
      const existingItem = existingMap.get(item.name);

      if (!existingItem) {
        // Inserir novo equipamento
        await db.insert(equipment).values(item);
        console.log(`  ✅ Inserted: ${item.name} [${item.rarity}] - ${item.equipableType}:${item.equipableTarget || 'universal'}`);
        inserted++;
      } else {
        // Verificar se precisa atualizar
        const needsUpdate = 
          existingItem.rarity !== item.rarity ||
          existingItem.description !== item.description ||
          existingItem.equipableType !== item.equipableType ||
          existingItem.equipableTarget !== item.equipableTarget ||
          existingItem.bonusHp !== item.bonusHp ||
          existingItem.bonusAttack !== item.bonusAttack ||
          existingItem.bonusDefense !== item.bonusDefense ||
          existingItem.bonusSpeed !== item.bonusSpeed ||
          existingItem.bonusCritChance !== item.bonusCritChance ||
          existingItem.bonusCritDamage !== item.bonusCritDamage ||
          JSON.stringify(existingItem.passiveAbility) !== JSON.stringify(item.passiveAbility);

        if (needsUpdate) {
          await db
            .update(equipment)
            .set(item)
            .where(eq(equipment.id, existingItem.id));
          console.log(`  🔄 Updated: ${item.name}`);
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    console.log(`\n📊 [EQUIPMENT SYNC] Summary:`);
    console.log(`  ✅ Inserted: ${inserted}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ⏭️  Unchanged: ${unchanged}`);
    console.log(`  📦 Total in catalog: ${EQUIPMENT_CATALOG.length}`);
    console.log(`\n✅ [EQUIPMENT SYNC] Equipment catalog synchronized successfully!`);

  } catch (error) {
    console.error("❌ [EQUIPMENT SYNC] Error synchronizing equipment catalog:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

seedEquipment();
