#!/usr/bin/env node

/**
 * Script para popular estágios e mundos PVE no banco
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

const WORLDS = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Mundo 1: País das Ondas", description: "A primeira aventura no mundo dos ninjas.", position: 1, active: 1 },
  { id: "10000000-0000-4000-8000-000000000002", name: "Mundo 2: Grand Line", description: "A perigosa rota dos piratas.", position: 2, active: 1 },
  { id: "10000000-0000-4000-8000-000000000003", name: "Masmorra Elemental", description: "Cavernas cheias de monstros e tesouros.", position: 3, active: 1 },
  { id: "10000000-0000-4000-8000-000000000004", name: "Torre do Desafio", description: "Andares infinitos para testar sua força.", position: 4, active: 1 },
  { id: "10000000-0000-4000-8000-000000000005", name: "Raid de Chefes", description: "Inimigos lendários de poder extremo.", position: 5, active: 1 },
  { id: "10000000-0000-4000-8000-000000000006", name: "Invasão de Evento", description: "Eventos temporários com recompensas exclusivas.", position: 6, active: 1 },
];

const STAGES = [
  { id: "20000000-0000-4000-8000-000000000001", worldId: "10000000-0000-4000-8000-000000000001", name: "Fase 1", type: "story", position: 1, enemyName: "Bandido Genérico", enemyHp: 150, enemyAttack: 20, enemyDefense: 10, enemySpeed: 50, bossPhases: 1, enrageRound: 999, drops: [], rewardGold: 50, rewardXp: 30, active: 1 },
  { id: "20000000-0000-4000-8000-000000000002", worldId: "10000000-0000-4000-8000-000000000001", name: "Fase 2", type: "story", position: 2, enemyName: "Ninja Desertor", enemyHp: 200, enemyAttack: 25, enemyDefense: 12, enemySpeed: 55, bossPhases: 1, enrageRound: 999, drops: [], rewardGold: 75, rewardXp: 45, active: 1 },
  { id: "20000000-0000-4000-8000-000000000003", worldId: "10000000-0000-4000-8000-000000000001", name: "Chefe: Zabuza", type: "boss", position: 3, enemyName: "Zabuza Momochi", enemyHp: 400, enemyAttack: 35, enemyDefense: 18, enemySpeed: 60, bossPhases: 2, enrageRound: 10, drops: [], rewardGold: 150, rewardXp: 100, active: 1 },
  { id: "20000000-0000-4000-8000-000000000004", worldId: "10000000-0000-4000-8000-000000000002", name: "Fase 1", type: "story", position: 1, enemyName: "Pirata Comum", enemyHp: 250, enemyAttack: 30, enemyDefense: 15, enemySpeed: 52, bossPhases: 1, enrageRound: 999, drops: [], rewardGold: 100, rewardXp: 60, active: 1 },
  { id: "20000000-0000-4000-8000-000000000005", worldId: "10000000-0000-4000-8000-000000000002", name: "Fase 2", type: "story", position: 2, enemyName: "Capitão Pirata", enemyHp: 350, enemyAttack: 40, enemyDefense: 20, enemySpeed: 58, bossPhases: 1, enrageRound: 999, drops: [], rewardGold: 150, rewardXp: 90, active: 1 },
  { id: "20000000-0000-4000-8000-000000000006", worldId: "10000000-0000-4000-8000-000000000002", name: "Chefe: Arlong", type: "boss", position: 3, enemyName: "Arlong", enemyHp: 600, enemyAttack: 50, enemyDefense: 25, enemySpeed: 65, bossPhases: 2, enrageRound: 12, drops: [], rewardGold: 250, rewardXp: 150, active: 1 },
  { id: "20000000-0000-4000-8000-000000000007", worldId: "10000000-0000-4000-8000-000000000003", name: "Andar 1", type: "dungeon", position: 1, enemyName: "Golem de Pedra", enemyHp: 450, enemyAttack: 45, enemyDefense: 35, enemySpeed: 40, bossPhases: 1, enrageRound: 999, drops: [], rewardGold: 200, rewardXp: 120, active: 1 },
  { id: "20000000-0000-4000-8000-000000000008", worldId: "10000000-0000-4000-8000-000000000003", name: "Andar 2", type: "dungeon", position: 2, enemyName: "Espectro de Fogo", enemyHp: 500, enemyAttack: 55, enemyDefense: 30, enemySpeed: 70, bossPhases: 1, enrageRound: 999, drops: [], rewardGold: 250, rewardXp: 150, active: 1 },
];

async function seedPveStages() {
  const client = await pool.connect();
  
  try {
    console.log("🌱 Populando mundos e estágios PVE...\n");
    
    // Inserir mundos
    console.log(`📍 Inserindo ${WORLDS.length} mundos...`);
    for (const world of WORLDS) {
      await client.query(`
        INSERT INTO pve_worlds (id, name, description, position, active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          position = EXCLUDED.position,
          active = EXCLUDED.active
      `, [world.id, world.name, world.description, world.position, world.active]);
      console.log(`   ✅ ${world.name}`);
    }
    
    // Inserir estágios
    console.log(`\n⚔️  Inserindo ${STAGES.length} estágios...`);
    for (const stage of STAGES) {
      await client.query(`
        INSERT INTO pve_stages (
          id, world_id, name, type, position, 
          enemy_name, enemy_hp, enemy_attack, enemy_defense, enemy_speed,
          boss_phases, enrage_round, drops, reward_gold, reward_xp, active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          world_id = EXCLUDED.world_id,
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          position = EXCLUDED.position,
          enemy_name = EXCLUDED.enemy_name,
          enemy_hp = EXCLUDED.enemy_hp,
          enemy_attack = EXCLUDED.enemy_attack,
          enemy_defense = EXCLUDED.enemy_defense,
          enemy_speed = EXCLUDED.enemy_speed,
          boss_phases = EXCLUDED.boss_phases,
          enrage_round = EXCLUDED.enrage_round,
          drops = EXCLUDED.drops,
          reward_gold = EXCLUDED.reward_gold,
          reward_xp = EXCLUDED.reward_xp,
          active = EXCLUDED.active
      `, [
        stage.id, stage.worldId, stage.name, stage.type, stage.position,
        stage.enemyName, stage.enemyHp, stage.enemyAttack, stage.enemyDefense, stage.enemySpeed,
        stage.bossPhases, stage.enrageRound, JSON.stringify(stage.drops), stage.rewardGold, stage.rewardXp, stage.active
      ]);
      console.log(`   ✅ ${stage.name} - ${stage.enemyName}`);
    }
    
    console.log(`\n✅ Seed PVE concluído com sucesso!`);
    console.log(`   📊 ${WORLDS.length} mundos inseridos`);
    console.log(`   📊 ${STAGES.length} estágios inseridos\n`);
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPveStages();
