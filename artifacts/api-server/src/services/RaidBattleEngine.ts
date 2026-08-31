/**
 * ========================================
 * RAID BATTLE ENGINE
 * ========================================
 * 
 * Sistema de batalha para raids cooperativas.
 * Adaptado do BattleEngine da arena para suportar:
 * - Waves progressivas de inimigos
 * - Bosses com fases e mecânicas especiais
 * - 4 jogadores vs múltiplos inimigos
 * - Efeitos de ambiente
 * - Sistema de adds dinâmicos
 * 
 * Baseado em: battle/BattleEngine.ts
 */

import { BattleEngine } from "../battle/BattleEngine";
import { BattleState } from "../battle/BattleState";
import type { RaidMap, RaidWave } from "@workspace/db/data/raid-catalog";
import { logger } from "../lib/logger";

interface RaidFighter {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  role: string;
  team: "player" | "enemy";
  isAlive: boolean;
  ultimateCharge: number;
  statusEffects: any[];
  skills: any;
  passive?: any;
}

interface RaidBattleResult {
  victory: boolean;
  currentWave: number;
  totalWaves: number;
  battleLog: string[];
  survivors: RaidFighter[];
  casualties: string[];
  damageByCharacter: Record<string, number>;
  timeElapsed: number;
  bossPhaseReached?: number;
}

/**
 * Classe principal do motor de batalha de raid
 */
export class RaidBattleEngine {
  private raidMap: RaidMap;
  private difficulty: "normal" | "hard" | "nightmare";
  private playerTeam: RaidFighter[];
  private currentWave: number = 0;
  private battleLog: string[] = [];
  private damageByCharacter: Record<string, number> = {};
  private startTime: number = Date.now();
  private bossPhaseReached: number = 0;

  constructor(
    raidMap: RaidMap,
    difficulty: "normal" | "hard" | "nightmare",
    playerTeam: RaidFighter[]
  ) {
    this.raidMap = raidMap;
    this.difficulty = difficulty;
    this.playerTeam = playerTeam;

    // Inicializar tracking de dano
    for (const fighter of playerTeam) {
      this.damageByCharacter[fighter.id] = 0;
    }
  }

  /**
   * Aplicar multiplicadores de dificuldade
   */
  private applyDifficultyMultipliers(enemy: RaidFighter): RaidFighter {
    const multipliers = {
      normal: { hp: 1.0, attack: 1.0, defense: 1.0 },
      hard: { hp: 1.5, attack: 1.3, defense: 1.3 },
      nightmare: { hp: 2.5, attack: 1.8, defense: 1.8 },
    };

    const mult = multipliers[this.difficulty];

    return {
      ...enemy,
      hp: Math.floor(enemy.hp * mult.hp),
      maxHp: Math.floor(enemy.maxHp * mult.hp),
      attack: Math.floor(enemy.attack * mult.attack),
      defense: Math.floor(enemy.defense * mult.defense),
    };
  }

  /**
   * Criar inimigo a partir de dados da wave
   */
  private createEnemyFromWaveData(enemyData: any, index: number): RaidFighter {
    const enemy: RaidFighter = {
      id: `enemy_${this.currentWave}_${index}`,
      name: enemyData.name,
      hp: enemyData.hp,
      maxHp: enemyData.hp,
      attack: enemyData.attack,
      defense: enemyData.defense,
      speed: enemyData.speed,
      role: enemyData.role,
      team: "enemy",
      isAlive: true,
      ultimateCharge: 0,
      statusEffects: [],
      skills: {
        ultimate: {
          name: "Ataque Especial",
          chargeRequired: 100,
          type: "DAMAGE",
          targetType: "single_enemy",
          multiplier: 2.0,
        },
      },
      passive: enemyData.passive ? { description: enemyData.passive } : undefined,
    };

    return this.applyDifficultyMultipliers(enemy);
  }

  /**
   * Criar boss a partir de dados do raid map
   */
  private createBoss(): RaidFighter {
    const bossData = this.raidMap.boss;

    const boss: RaidFighter = {
      id: "boss",
      name: bossData.name,
      hp: bossData.hp,
      maxHp: bossData.hp,
      attack: bossData.attack,
      defense: bossData.defense,
      speed: bossData.speed,
      role: "tank",
      team: "enemy",
      isAlive: true,
      ultimateCharge: 50, // Boss começa com carga
      statusEffects: [],
      skills: {
        ultimate: {
          name: bossData.ultimate.name,
          description: bossData.ultimate.description,
          chargeRequired: 100,
          type: "DAMAGE",
          targetType: "aoe_enemy",
          multiplier: bossData.ultimate.multiplier,
          effects: bossData.ultimate.effects,
        },
      },
      passive: { description: bossData.passive },
    };

    return this.applyDifficultyMultipliers(boss);
  }

  /**
   * Criar adds (inimigos invocados pelo boss)
   */
  private createAdds(count: number, phase: number): RaidFighter[] {
    const adds: RaidFighter[] = [];
    
    // Usar inimigos da primeira wave como base para adds
    const baseEnemies = this.raidMap.waves[0].enemies;

    for (let i = 0; i < count; i++) {
      const baseEnemy = baseEnemies[i % baseEnemies.length];
      
      const add: RaidFighter = {
        id: `add_phase${phase}_${i}`,
        name: `${baseEnemy.name} (Add)`,
        hp: Math.floor(baseEnemy.hp * 0.7), // Adds tem menos HP
        maxHp: Math.floor(baseEnemy.hp * 0.7),
        attack: baseEnemy.attack,
        defense: baseEnemy.defense,
        speed: baseEnemy.speed,
        role: baseEnemy.role,
        team: "enemy",
        isAlive: true,
        ultimateCharge: 0,
        statusEffects: [],
        skills: {
          ultimate: {
            name: "Ataque Rápido",
            chargeRequired: 100,
            type: "DAMAGE",
            targetType: "single_enemy",
            multiplier: 1.5,
          },
        },
      };

      adds.push(this.applyDifficultyMultipliers(add));
    }

    return adds;
  }

  /**
   * Verificar fases do boss e aplicar mecânicas
   */
  private checkBossPhases(boss: RaidFighter, enemyTeam: RaidFighter[]): RaidFighter[] {
    const hpPercent = (boss.hp / boss.maxHp) * 100;

    for (const phase of this.raidMap.boss.phases) {
      if (hpPercent <= phase.hpThreshold && this.bossPhaseReached < phase.hpThreshold) {
        this.bossPhaseReached = phase.hpThreshold;
        
        this.battleLog.push(
          `\n🔥 **FASE DO BOSS ATIVADA!** 🔥\n` +
          `**${boss.name}**: ${phase.effect}\n`
        );

        // Aplicar efeitos da fase
        if (phase.effect.includes("+") && phase.effect.includes("ATK")) {
          const match = phase.effect.match(/\+(\d+)%\s+ATK/);
          if (match) {
            const bonus = parseInt(match[1]);
            boss.attack = Math.floor(boss.attack * (1 + bonus / 100));
          }
        }

        if (phase.effect.includes("+") && phase.effect.includes("DEF")) {
          const match = phase.effect.match(/\+(\d+)%\s+DEF/);
          if (match) {
            const bonus = parseInt(match[1]);
            boss.defense = Math.floor(boss.defense * (1 + bonus / 100));
          }
        }

        if (phase.effect.includes("+") && phase.effect.includes("SPD")) {
          const match = phase.effect.match(/\+(\d+)\s+SPD/);
          if (match) {
            const bonus = parseInt(match[1]);
            boss.speed += bonus;
          }
        }

        // Invocar adds
        if (phase.addsToSpawn && phase.addsToSpawn > 0) {
          const adds = this.createAdds(phase.addsToSpawn, phase.hpThreshold);
          enemyTeam.push(...adds);
          
          this.battleLog.push(
            `👹 **${boss.name}** invocou ${phase.addsToSpawn} aliados!\n`
          );
        }

        // Curar boss se especificado
        if (phase.effect.includes("Recupera") && phase.effect.includes("HP")) {
          const match = phase.effect.match(/Recupera (\d+) HP/);
          if (match) {
            const healAmount = parseInt(match[1]);
            boss.hp = Math.min(boss.hp + healAmount, boss.maxHp);
            
            this.battleLog.push(
              `💚 **${boss.name}** recuperou ${healAmount} HP!\n`
            );
          }
        }
      }
    }

    return enemyTeam;
  }

  /**
   * Executar uma wave de batalha
   */
  private async executeWaveBattle(wave: RaidWave): Promise<boolean> {
    this.battleLog.push(
      `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ **WAVE ${wave.wave}/${this.raidMap.waves.length}** ⚔️\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n`
    );

    // Criar inimigos da wave
    let enemyTeam: RaidFighter[] = wave.enemies.map((enemy, index) =>
      this.createEnemyFromWaveData(enemy, index)
    );

    // Aplicar efeito de ambiente se houver
    if (wave.environmentEffect) {
      this.battleLog.push(
        `🌍 **Efeito Ambiental:** ${wave.environmentEffect.description}\n\n`
      );
    }

    // Simular batalha usando BattleEngine existente
    // (simplificado - na prática, usar o BattleEngine completo)
    let round = 0;
    const maxRounds = 50;

    while (round < maxRounds) {
      round++;

      // Verificar vivos
      const alivePlayers = this.playerTeam.filter((f) => f.isAlive);
      const aliveEnemies = enemyTeam.filter((f) => f.isAlive);

      if (alivePlayers.length === 0) {
        this.battleLog.push(`\n💀 **DERROTA!** Time eliminado!\n`);
        return false;
      }

      if (aliveEnemies.length === 0) {
        this.battleLog.push(
          `\n✅ **Wave ${wave.wave} Concluída!**\n` +
          `Sobreviventes: ${alivePlayers.length}/4\n`
        );
        
        // Curar 20% após cada wave
        for (const fighter of alivePlayers) {
          const healAmount = Math.floor(fighter.maxHp * 0.2);
          fighter.hp = Math.min(fighter.hp + healAmount, fighter.maxHp);
        }
        
        return true;
      }

      // Ordenar por velocidade
      const allFighters = [...alivePlayers, ...aliveEnemies].sort(
        (a, b) => b.speed - a.speed
      );

      // Executar turno de cada fighter
      for (const fighter of allFighters) {
        if (!fighter.isAlive) continue;

        const targets = fighter.team === "player" ? aliveEnemies : alivePlayers;
        if (targets.length === 0) break;

        // Ataque básico simplificado
        const target = targets[Math.floor(Math.random() * targets.length)];
        const damage = Math.max(
          1,
          Math.floor(fighter.attack * 0.8 - target.defense * 0.3)
        );

        target.hp -= damage;

        if (fighter.team === "player") {
          this.damageByCharacter[fighter.id] =
            (this.damageByCharacter[fighter.id] || 0) + damage;
        }

        if (target.hp <= 0) {
          target.hp = 0;
          target.isAlive = false;
        }
      }

      // Aplicar efeito de ambiente
      if (wave.environmentEffect) {
        if (wave.environmentEffect.type === "burn") {
          for (const fighter of alivePlayers) {
            fighter.hp = Math.max(0, fighter.hp - wave.environmentEffect.value);
            if (fighter.hp === 0) {
              fighter.isAlive = false;
            }
          }
        }
      }
    }

    // Timeout
    this.battleLog.push(`\n⏰ **TEMPO ESGOTADO!** Batalha muito longa.\n`);
    return false;
  }

  /**
   * Executar batalha contra o boss
   */
  private async executeBossBattle(): Promise<boolean> {
    this.battleLog.push(
      `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💀 **BOSS BATTLE** 💀\n` +
      `${this.raidMap.boss.name} - ${this.raidMap.boss.title}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n`
    );

    let boss = this.createBoss();
    let enemyTeam: RaidFighter[] = [boss];

    let round = 0;
    const maxRounds = 100; // Boss battles podem ser longas

    while (round < maxRounds) {
      round++;

      // Verificar vivos
      const alivePlayers = this.playerTeam.filter((f) => f.isAlive);
      const aliveEnemies = enemyTeam.filter((f) => f.isAlive);

      if (alivePlayers.length === 0) {
        this.battleLog.push(`\n💀 **DERROTA!** Time eliminado pelo boss!\n`);
        return false;
      }

      if (aliveEnemies.length === 0) {
        this.battleLog.push(
          `\n🎉 **VITÓRIA!** ${this.raidMap.boss.name} foi derrotado!\n`
        );
        return true;
      }

      // Verificar fases do boss
      if (boss.isAlive) {
        enemyTeam = this.checkBossPhases(boss, enemyTeam);
      }

      // Ordenar por velocidade
      const allFighters = [...alivePlayers, ...aliveEnemies].sort(
        (a, b) => b.speed - a.speed
      );

      // Executar turno
      for (const fighter of allFighters) {
        if (!fighter.isAlive) continue;

        const targets = fighter.team === "player" ? aliveEnemies : alivePlayers;
        if (targets.length === 0) break;

        const target = targets[Math.floor(Math.random() * targets.length)];
        const damage = Math.max(
          1,
          Math.floor(fighter.attack - target.defense * 0.4)
        );

        target.hp -= damage;

        if (fighter.team === "player") {
          this.damageByCharacter[fighter.id] =
            (this.damageByCharacter[fighter.id] || 0) + damage;
        }

        if (target.hp <= 0) {
          target.hp = 0;
          target.isAlive = false;

          if (target.id === "boss") {
            this.battleLog.push(
              `\n💥 **${target.name}** foi derrotado!\n`
            );
          }
        }
      }

      // Boss ultimate a cada X turnos
      if (round % 5 === 0 && boss.isAlive) {
        this.battleLog.push(
          `\n✨ **${boss.name}** usou **${boss.skills.ultimate.name}**!\n`
        );
        
        // Dano AoE no time
        for (const fighter of this.playerTeam) {
          if (fighter.isAlive) {
            const damage = Math.floor(boss.attack * boss.skills.ultimate.multiplier);
            fighter.hp = Math.max(0, fighter.hp - damage);
            
            if (fighter.hp === 0) {
              fighter.isAlive = false;
            }
          }
        }
      }
    }

    this.battleLog.push(`\n⏰ **TEMPO ESGOTADO!** Boss muito forte.\n`);
    return false;
  }

  /**
   * Executar raid completa
   */
  async executeRaid(): Promise<RaidBattleResult> {
    logger.info(
      `[RAID BATTLE] Starting raid: ${this.raidMap.name} (${this.difficulty})`
    );

    this.battleLog.push(
      `🏰 **RAID: ${this.raidMap.name}** 🏰\n` +
      `${this.difficulty === "normal" ? "🟢" : this.difficulty === "hard" ? "🟡" : "🔴"} ${this.difficulty.toUpperCase()}\n\n` +
      `👥 **Time:**\n`
    );

    for (const fighter of this.playerTeam) {
      this.battleLog.push(`   • ${fighter.name} (${fighter.hp} HP)\n`);
    }

    this.battleLog.push(`\n━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Executar waves
    for (let i = 0; i < this.raidMap.waves.length; i++) {
      this.currentWave = i + 1;
      const wave = this.raidMap.waves[i];

      const waveVictory = await this.executeWaveBattle(wave);

      if (!waveVictory) {
        // Derrota
        return {
          victory: false,
          currentWave: this.currentWave,
          totalWaves: this.raidMap.waves.length + 1,
          battleLog: this.battleLog,
          survivors: this.playerTeam.filter((f) => f.isAlive),
          casualties: this.playerTeam
            .filter((f) => !f.isAlive)
            .map((f) => f.name),
          damageByCharacter: this.damageByCharacter,
          timeElapsed: Math.floor((Date.now() - this.startTime) / 1000),
        };
      }
    }

    // Boss battle
    this.currentWave = this.raidMap.waves.length + 1;
    const bossVictory = await this.executeBossBattle();

    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);

    if (bossVictory) {
      logger.info(
        `[RAID BATTLE] Victory! Time: ${timeElapsed}s, Waves: ${this.currentWave}`
      );
    } else {
      logger.info(`[RAID BATTLE] Defeat at wave ${this.currentWave}`);
    }

    return {
      victory: bossVictory,
      currentWave: this.currentWave,
      totalWaves: this.raidMap.waves.length + 1,
      battleLog: this.battleLog,
      survivors: this.playerTeam.filter((f) => f.isAlive),
      casualties: this.playerTeam.filter((f) => !f.isAlive).map((f) => f.name),
      damageByCharacter: this.damageByCharacter,
      timeElapsed,
      bossPhaseReached: this.bossPhaseReached,
    };
  }
}

/**
 * Helper: Criar fighter a partir de personagem do usuário
 */
export function createRaidFighterFromCharacter(
  userChar: any,
  char: any,
  equipment: any
): RaidFighter {
  // Calcular stats com level, maestria e equipamento
  const level = userChar.level;
  const masteryLevel = userChar.masteryLevel || 1;
  const masteryBoost = (masteryLevel - 1) * 0.05; // 5% por nível

  let hp = Math.floor(char.baseHp * (1 + masteryBoost)) + level * 10;
  let attack = Math.floor(char.baseAttack * (1 + masteryBoost)) + level * 2;
  let defense = Math.floor(char.baseDefense * (1 + masteryBoost)) + level * 2;
  let speed = char.baseSpeed + Math.floor(level * 0.5);

  // Aplicar bônus de equipamento
  if (equipment) {
    hp += equipment.bonusHp || 0;
    attack += equipment.bonusAttack || 0;
    defense += equipment.bonusDefense || 0;
    speed += equipment.bonusSpeed || 0;
  }

  return {
    id: userChar.id,
    name: char.name,
    hp,
    maxHp: hp,
    attack,
    defense,
    speed,
    role: char.role,
    team: "player",
    isAlive: true,
    ultimateCharge: 0,
    statusEffects: [],
    skills: char.ultimate || {
      ultimate: {
        name: "Ultimate",
        chargeRequired: 100,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 2.5,
      },
    },
    passive: char.passiveAbility,
  };
}
