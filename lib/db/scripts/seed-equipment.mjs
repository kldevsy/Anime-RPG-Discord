#!/usr/bin/env node

/**
 * Script para popular equipamentos no banco
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

// Catálogo de equipamentos
const EQUIPMENT_CATALOG = [
  // ============================================
  // 🥇 EQUIPAMENTOS DE PERSONAGEM ESPECÍFICO (Sempre com passiva)
  // ============================================
  
  {
    name: "Bandana do Zoro",
    rarity: "epic",
    description: "A icônica bandana verde que Zoro usa em batalhas sérias",
    equipableType: "character",
    equipableTarget: "Roronoa Zoro",
    bonusHp: 0,
    bonusAttack: 80,
    bonusDefense: 0,
    bonusSpeed: 30,
    bonusCritChance: 10,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "three_sword_mastery",
      name: "Maestria das Três Espadas",
      description: "Ataques básicos têm 30% de chance de atacar 3 vezes seguidas",
      trigger: "on_attack",
      effects: [{ type: "multi_attack", target: "self", value: 3, chance: 30 }]
    },
  },
  
  {
    name: "Venda dos Seis Olhos",
    rarity: "mythic",
    description: "Venda que sela o poder avassalador dos Seis Olhos de Gojo",
    equipableType: "character",
    equipableTarget: "Satoru Gojo",
    bonusHp: 0,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusSpeed: 50,
    bonusCritChance: 20,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "six_eyes_power",
      name: "Poder dos Seis Olhos",
      description: "Ganha +30 de carga de ultimate por turno",
      trigger: "on_turn_start",
      effects: [{ type: "ultimate_charge", target: "self", value: 30 }]
    },
  },
  
  {
    name: "Colar de Tsunade",
    rarity: "legendary",
    description: "Colar precioso dado por Tsunade a Naruto",
    equipableType: "character",
    equipableTarget: "Naruto Uzumaki",
    bonusHp: 150,
    bonusAttack: 80,
    bonusDefense: 50,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "nine_tails_awakening",
      name: "Despertar da Nove Caudas",
      description: "Ao ficar abaixo de 40% HP, ganha +50% ATK e +30% SPD por 3 turnos",
      trigger: "on_hp_threshold",
      effects: [
        { type: "stat_boost", target: "self", stat: "attack", value: 50, duration: 3 },
        { type: "stat_boost", target: "self", stat: "speed", value: 30, duration: 3 }
      ]
    },
  },
  
  // ============================================
  // ⚔️ EQUIPAMENTOS DE CLASSE - DPS
  // ============================================
  
  {
    name: "Katana Afiada",
    rarity: "epic",
    description: "Katana extremamente afiada para DPS",
    equipableType: "role",
    equipableTarget: "dps",
    bonusHp: 0,
    bonusAttack: 100,
    bonusDefense: 0,
    bonusSpeed: 0,
    bonusCritChance: 15,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "sharp_blade",
      name: "Lâmina Afiada",
      description: "Críticos causam +30% de dano",
      trigger: "on_critical_hit",
      effects: [{ type: "damage_boost", target: "self", value: 30 }]
    },
  },
  
  {
    name: "Adaga Rápida",
    rarity: "rare",
    description: "Adaga leve que aumenta velocidade e ataque",
    equipableType: "role",
    equipableTarget: "dps",
    bonusHp: 0,
    bonusAttack: 60,
    bonusDefense: 0,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
  },
  
  // ============================================
  // 🛡️ EQUIPAMENTOS DE CLASSE - TANK
  // ============================================
  
  {
    name: "Escudo Indestrutível",
    rarity: "legendary",
    description: "Escudo que protege contra ataques fatais",
    equipableType: "role",
    equipableTarget: "tank",
    bonusHp: 200,
    bonusAttack: 0,
    bonusDefense: 120,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "unbreakable",
      name: "Indestrutível",
      description: "Ao receber dano fatal, sobrevive com 1 HP (1x por batalha)",
      trigger: "on_lethal_damage",
      effects: [{ type: "survive_fatal", target: "self", value: 1 }]
    },
  },
  
  {
    name: "Armadura Pesada",
    rarity: "epic",
    description: "Armadura que aumenta HP e defesa",
    equipableType: "role",
    equipableTarget: "tank",
    bonusHp: 180,
    bonusAttack: 0,
    bonusDefense: 90,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
  },
  
  // ============================================
  // 🌟 EQUIPAMENTOS UNIVERSAIS
  // ============================================
  
  {
    name: "Anel do Destino",
    rarity: "mythic",
    description: "Anel místico que desafia o destino",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 100,
    bonusAttack: 80,
    bonusDefense: 80,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "cheat_death",
      name: "Trapacear a Morte",
      description: "10% de chance de ressuscitar ao morrer com 50% HP (1x por batalha)",
      trigger: "on_death",
      effects: [{ type: "revive", target: "self", value: 50, chance: 10 }]
    },
  },
  
  {
    name: "Colar de Energia",
    rarity: "epic",
    description: "Colar que aumenta stats balanceados",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 80,
    bonusAttack: 50,
    bonusDefense: 50,
    bonusSpeed: 20,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
  },
  
  {
    name: "Brincos de Prata",
    rarity: "rare",
    description: "Brincos que aumentam velocidade e crítico",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 0,
    bonusAttack: 40,
    bonusDefense: 0,
    bonusSpeed: 50,
    bonusCritChance: 10,
    bonusCritDamage: 0,
    passiveAbility: null,
  },
];

async function seedEquipment() {
  const client = await pool.connect();
  
  try {
    console.log("🗡️ [EQUIPMENT SYNC] Starting equipment catalog synchronization...\n");
    
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    
    for (const item of EQUIPMENT_CATALOG) {
      // Verifica se já existe
      const existing = await client.query(
        'SELECT * FROM equipment WHERE name = $1 AND catalog_managed = true',
        [item.name]
      );
      
      if (existing.rows.length === 0) {
        // Inserir novo equipamento
        await client.query(`
          INSERT INTO equipment (
            name, rarity, description, equipable_type, equipable_target,
            bonus_hp, bonus_attack, bonus_defense, bonus_speed,
            bonus_crit_chance, bonus_crit_damage,
            passive_ability, catalog_managed
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        `, [
          item.name,
          item.rarity,
          item.description,
          item.equipableType,
          item.equipableTarget,
          item.bonusHp,
          item.bonusAttack,
          item.bonusDefense,
          item.bonusSpeed,
          item.bonusCritChance,
          item.bonusCritDamage,
          item.passiveAbility ? JSON.stringify(item.passiveAbility) : null
        ]);
        
        const equipableText = item.equipableType === 'character' 
          ? `${item.equipableTarget}` 
          : item.equipableType === 'role' 
            ? `${item.equipableTarget?.toUpperCase()}` 
            : 'Universal';
            
        console.log(`  ✅ Inserted: ${item.name} [${item.rarity}] - ${equipableText}`);
        inserted++;
      } else {
        // Atualizar existente
        await client.query(`
          UPDATE equipment SET
            rarity = $2,
            description = $3,
            equipable_type = $4,
            equipable_target = $5,
            bonus_hp = $6,
            bonus_attack = $7,
            bonus_defense = $8,
            bonus_speed = $9,
            bonus_crit_chance = $10,
            bonus_crit_damage = $11,
            passive_ability = $12
          WHERE name = $1 AND catalog_managed = true
        `, [
          item.name,
          item.rarity,
          item.description,
          item.equipableType,
          item.equipableTarget,
          item.bonusHp,
          item.bonusAttack,
          item.bonusDefense,
          item.bonusSpeed,
          item.bonusCritChance,
          item.bonusCritDamage,
          item.passiveAbility ? JSON.stringify(item.passiveAbility) : null
        ]);
        
        unchanged++;
      }
    }
    
    console.log(`\n📊 [EQUIPMENT SYNC] Summary:`);
    console.log(`  ✅ Inserted: ${inserted}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ⏭️  Unchanged: ${unchanged}`);
    console.log(`  📦 Total in catalog: ${EQUIPMENT_CATALOG.length}`);
    console.log(`\n✅ [EQUIPMENT SYNC] Equipment catalog synchronized successfully!`);
    
  } catch (error) {
    console.error("❌ [EQUIPMENT SYNC] Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEquipment();
