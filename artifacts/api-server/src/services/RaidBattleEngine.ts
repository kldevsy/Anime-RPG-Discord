/**
 * ========================================
 * RAID BATTLE ENGINE
 * ========================================
 *
 * Motor de batalha para raids cooperativas.
 * Usa o BattleEngine do arena como base para CADA wave/boss,
 * garantindo o mesmo sistema de dano, status, passivas e IA.
 *
 * Fluxo:
 *  1. Waves de inimigos (usando BattleEngine)
 *  2. Recuperação parcial entre waves (30% HP)
 *  3. Batalha contra o Boss (usando BattleEngine com boss como inimigo especial)
 *
 * Cada wave/boss roda `new BattleEngine(playerTeam, enemyTeam).run()`.
 * O time do jogador carrega HP/status entre waves (persistência de estado).
 */

import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant } from "../battle/BattleState";
import type { RaidMap, RaidWave } from "@workspace/db/data/raid-catalog";
import { logger } from "../lib/logger";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ──────────────────────────────────────────────────────────────────────────────

export interface RaidFighterInput {
  id: string;           // userCharacterId
  name: string;
  maxHp: number;
  currentHp: number;    // HP atual (pode diferir de maxHp)
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  critDamage: number;
  role: "tank" | "dps" | "support" | "healer" | "control";
  ultimate?: any | null;
  passiveAbility?: any | null;
  passive?: string | null;
}

export interface RaidBattleResult {
  victory: boolean;
  waveReached: number;
  totalWaves: number;
  battleLog: string[];
  survivors: Array<{ id: string; name: string; hp: number; alive: boolean }>;
  casualties: string[];
  damageByCharacter: Record<string, number>;
  timeElapsed: number;  // segundos
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: converter RaidFighterInput → Combatant
// ──────────────────────────────────────────────────────────────────────────────

function toPlayerCombatant(fighter: RaidFighterInput, currentHp?: number): Combatant {
  return SkillManager.createCombatant({
    id: fighter.id,
    name: fighter.name,
    role: fighter.role,
    maxHp: fighter.maxHp,
    hp: currentHp ?? fighter.currentHp,
    attack: fighter.attack,
    defense: fighter.defense,
    speed: fighter.speed,
    critChance: fighter.critChance,
    critDamage: fighter.critDamage,
    ultimate: fighter.ultimate ?? null,
    passive: fighter.passive ?? undefined,
    passiveAbility: fighter.passiveAbility ?? undefined,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: criar inimigo (wave enemy / boss) como Combatant
// ──────────────────────────────────────────────────────────────────────────────

function toEnemyCombatant(
  id: string,
  data: { name: string; hp: number; attack: number; defense: number; speed: number; role?: string },
  isBoss = false,
  bossPhases?: number,
  enrageRound?: number,
): Combatant {
  const role = (data.role ?? "dps") as Combatant["role"];
  return SkillManager.createCombatant({
    id,
    name: data.name,
    role,
    maxHp: data.hp,
    hp: data.hp,
    attack: data.attack,
    defense: data.defense,
    speed: data.speed,
    critChance: 10,
    critDamage: 1.5,
    isBoss,
    maxPhases: bossPhases,
    enrageRound: enrageRound ?? 8,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Multiplicadores de dificuldade
// ──────────────────────────────────────────────────────────────────────────────

const DIFFICULTY_MULT: Record<string, { hp: number; attack: number; defense: number }> = {
  normal:    { hp: 1.0, attack: 1.0, defense: 1.0 },
  hard:      { hp: 1.6, attack: 1.4, defense: 1.3 },
  nightmare: { hp: 2.5, attack: 1.9, defense: 1.7 },
};

function applyDifficultyMult(
  data: { hp: number; attack: number; defense: number; speed: number; name: string; role?: string },
  difficulty: string,
): typeof data {
  const m = DIFFICULTY_MULT[difficulty] ?? DIFFICULTY_MULT.normal;
  return {
    ...data,
    hp: Math.floor(data.hp * m.hp),
    attack: Math.floor(data.attack * m.attack),
    defense: Math.floor(data.defense * m.defense),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Classe Principal
// ──────────────────────────────────────────────────────────────────────────────

export class RaidBattleEngine {
  private battleLog: string[] = [];
  private damageByCharacter: Record<string, number> = {};
  private startTime = Date.now();

  // Estado dos personagens (persiste entre waves)
  private playerCombatants: Combatant[];

  constructor(
    private readonly raidMap: RaidMap,
    private readonly difficulty: "normal" | "hard" | "nightmare",
    fighters: RaidFighterInput[],
  ) {
    this.playerCombatants = fighters.map(f => toPlayerCombatant(f));
    for (const f of fighters) {
      this.damageByCharacter[f.id] = 0;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Entrada pública
  // ────────────────────────────────────────────────────────────────────────────

  async executeRaid(): Promise<RaidBattleResult> {
    logger.info(`[RAID BATTLE] Starting raid: ${this.raidMap.name} (${this.difficulty})`);

    // Waves
    for (let i = 0; i < this.raidMap.waves.length; i++) {
      const wave = this.raidMap.waves[i];

      this.log(`\n━━━━━━━━━━━━━━━━━━━━━━`);
      this.log(`⚔️ **WAVE ${wave.wave}/${this.raidMap.waves.length}**`);
      if (wave.environmentEffect) {
        this.log(`🌍 Efeito: ${wave.environmentEffect.description}`);
      }
      this.log(`━━━━━━━━━━━━━━━━━━━━━━`);

      const survived = await this.runWave(wave, i);
      if (!survived) {
        logger.info(`[RAID BATTLE] Defeat at wave ${wave.wave}`);
        return this.buildResult(false, wave.wave);
      }

      // Recuperação entre waves (30% HP)
      if (i < this.raidMap.waves.length - 1) {
        for (const p of this.playerCombatants) {
          if (p.alive) {
            const heal = Math.floor(p.maxHp * 0.30);
            p.hp = Math.min(p.maxHp, p.hp + heal);
          }
        }
        this.log(`\n💚 Time recuperou 30% HP entre waves.`);
      }
    }

    // Boss
    this.log(`\n━━━━━━━━━━━━━━━━━━━━━━`);
    this.log(`💀 **BOSS BATTLE: ${this.raidMap.boss.name}** — ${this.raidMap.boss.title}`);
    this.log(`━━━━━━━━━━━━━━━━━━━━━━`);

    const bossVictory = await this.runBoss();
    if (!bossVictory) {
      return this.buildResult(false, this.raidMap.waves.length + 1);
    }

    this.log(`\n🎉 **${this.raidMap.boss.name} derrotado! RAID COMPLETA!** 🎉`);
    return this.buildResult(true, this.raidMap.waves.length + 1);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Executar uma wave usando BattleEngine real
  // ────────────────────────────────────────────────────────────────────────────

  private async runWave(wave: RaidWave, waveIndex: number): Promise<boolean> {
    // Criar inimigos da wave
    const enemyTeam: Combatant[] = wave.enemies.map((e, idx) => {
      const scaled = applyDifficultyMult(e, this.difficulty);
      return toEnemyCombatant(`wave${wave.wave}_enemy${idx}`, scaled);
    });

    // Snapshot dos jogadores vivos (para o engine desta wave)
    const activePlayers = this.playerCombatants.filter(p => p.alive);
    if (activePlayers.length === 0) return false;

    // Rodar batalha
    const engine = new BattleEngine(activePlayers, enemyTeam);
    const result = engine.run(60);

    // Aplicar efeito de ambiente (DoT/debuff pós-batalha)
    if (wave.environmentEffect) {
      this.applyEnvironmentEffect(wave.environmentEffect);
    }

    // Sincronizar HP/alive de volta para playerCombatants
    this.syncPlayerStateAfterBattle(result.playerTeam);

    // Acumular dano
    this.accumulateDamage(result.actions, activePlayers);

    const victoryWave = result.phase === "VICTORY";

    if (victoryWave) {
      const alive = this.playerCombatants.filter(p => p.alive).length;
      this.log(`✅ Wave ${wave.wave} concluída! Sobreviventes: ${alive}/${this.playerCombatants.length}`);
    } else {
      this.log(`💀 Derrota na wave ${wave.wave}!`);
    }

    return victoryWave;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Executar o boss usando BattleEngine real
  // ────────────────────────────────────────────────────────────────────────────

  private async runBoss(): Promise<boolean> {
    const bossData = this.raidMap.boss;
    const scaledBoss = applyDifficultyMult(
      {
        hp: bossData.hp,
        attack: bossData.attack,
        defense: bossData.defense,
        speed: (bossData as any).speed ?? 95,
        name: bossData.name,
        role: "dps",
      },
      this.difficulty,
    );

    const boss = toEnemyCombatant(
      "boss_main",
      scaledBoss,
      true,                           // isBoss = true  → ativa enrage
      bossData.phases?.length ?? 0,
      (bossData as any).enrageRound ?? 8,
    );

    // Adds iniciais do boss (se houver)
    const enemyTeam: Combatant[] = [boss];
    if (bossData.phases) {
      // Fases cujas mecânicas são adds na fase inicial (hpThreshold === 100)
      for (const phase of bossData.phases) {
        if (phase.hpThreshold >= 100 && phase.addsToSpawn) {
          for (let i = 0; i < phase.addsToSpawn; i++) {
            const add = applyDifficultyMult(
              { hp: Math.floor(bossData.hp * 0.3), attack: Math.floor(bossData.attack * 0.5), defense: Math.floor(bossData.defense * 0.5), speed: 80, name: `Servo de ${bossData.name}`, role: "dps" },
              this.difficulty,
            );
            enemyTeam.push(toEnemyCombatant(`boss_add_${i}`, add));
          }
        }
      }
    }

    const activePlayers = this.playerCombatants.filter(p => p.alive);
    if (activePlayers.length === 0) return false;

    // Boss battle: mais rodadas para acomodar mecânicas
    const engine = new BattleEngine(activePlayers, enemyTeam);
    const result = engine.run(120);

    // Aplicar fases do boss manualmente pós-resultado (log narrativo)
    if (bossData.phases) {
      for (const phase of bossData.phases) {
        const phaseName = phase.effect ?? `Fase ${phase.hpThreshold}%`;
        this.log(`🔥 Boss ativou fase aos ${phase.hpThreshold}% HP: ${phaseName}`);
      }
    }

    // Sincronizar estado
    this.syncPlayerStateAfterBattle(result.playerTeam);
    this.accumulateDamage(result.actions, activePlayers);

    const bossVictory = result.phase === "VICTORY";

    if (bossVictory) {
      const alive = this.playerCombatants.filter(p => p.alive).length;
      this.log(`🎉 Boss derrotado! Sobreviventes: ${alive}/${this.playerCombatants.length}`);
    } else {
      this.log(`💀 Time eliminado pelo boss!`);
    }

    return bossVictory;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers internos
  // ────────────────────────────────────────────────────────────────────────────

  /** Sincroniza hp/alive de volta ao playerCombatants persistente após um BattleEngine.run() */
  private syncPlayerStateAfterBattle(resultTeam: Combatant[]): void {
    for (const updated of resultTeam) {
      const persistent = this.playerCombatants.find(p => p.id === updated.id);
      if (persistent) {
        persistent.hp = updated.hp;
        persistent.alive = updated.alive;
        // Mantém status effects entre waves
        persistent.statusEffects = updated.statusEffects;
        persistent.ultimateCharge = updated.ultimateCharge;
      }
    }
  }

  /** Acumula dano infligido por cada jogador a partir das BattleActions */
  private accumulateDamage(actions: import("../battle/BattleState").BattleAction[], activePlayers: Combatant[]): void {
    const playerIds = new Set(activePlayers.map(p => p.id));
    for (const action of actions) {
      if (!playerIds.has(action.actorId)) continue;
      if (
        action.type === "basic_attack" ||
        action.type === "skill1" ||
        action.type === "skill2" ||
        action.type === "ultimate"
      ) {
        const dmg = action.amount ?? 0;
        this.damageByCharacter[action.actorId] = (this.damageByCharacter[action.actorId] ?? 0) + dmg;
      }
    }
  }

  /** Aplica efeito ambiental da wave sobre jogadores vivos */
  private applyEnvironmentEffect(effect: { type: string; value: number; description: string }): void {
    if (!effect) return;
    for (const p of this.playerCombatants) {
      if (!p.alive) continue;
      if (effect.type === "burn" || effect.type === "poison" || effect.type === "damage") {
        p.hp = Math.max(1, p.hp - effect.value);
        if (p.hp <= 1) {
          this.log(`⚠️ ${p.name} quase morreu pelo efeito ambiental!`);
        }
      }
    }
  }

  private log(msg: string): void {
    this.battleLog.push(msg);
  }

  private buildResult(victory: boolean, waveReached: number): RaidBattleResult {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const survivors = this.playerCombatants.map(p => ({
      id: p.id,
      name: p.name,
      hp: p.hp,
      alive: p.alive,
    }));
    const casualties = this.playerCombatants
      .filter(p => !p.alive)
      .map(p => p.name);

    return {
      victory,
      waveReached,
      totalWaves: this.raidMap.waves.length + 1, // +1 pelo boss
      battleLog: this.battleLog,
      survivors,
      casualties,
      damageByCharacter: this.damageByCharacter,
      timeElapsed: elapsed,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory: converter dados do DB → RaidFighterInput
// ──────────────────────────────────────────────────────────────────────────────

export function createRaidFighterFromCharacter(
  userChar: {
    id: string;
    level: number;
    masteryLevel?: number | null;
  },
  char: {
    name: string;
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    baseCritChance?: number | null;
    baseCritDamage?: number | null;
    role: string;
    passiveAbility?: any;
    ultimates?: any[];
  },
  equippedItem?: { attackBonus?: number | null; defenseBonus?: number | null; hpBonus?: number | null; speedBonus?: number | null } | null,
): RaidFighterInput {
  const level = userChar.level ?? 1;
  const mastery = userChar.masteryLevel ?? 1;
  const masteryMult = 1 + (mastery - 1) * 0.05;

  const baseHp = char.baseHp + level * 10;
  const baseAtk = char.baseAttack + level * 5;
  const baseDef = char.baseDefense + level * 3;
  const baseSpd = char.baseSpeed + Math.floor(level * 0.5);

  const equipHp  = equippedItem?.hpBonus  ?? 0;
  const equipAtk = equippedItem?.attackBonus  ?? 0;
  const equipDef = equippedItem?.defenseBonus ?? 0;
  const equipSpd = equippedItem?.speedBonus   ?? 0;

  const ultimate = char.ultimates?.[0] ?? null;

  return {
    id: userChar.id,
    name: char.name,
    maxHp: Math.floor((baseHp + equipHp) * masteryMult),
    currentHp: Math.floor((baseHp + equipHp) * masteryMult),
    attack: Math.floor((baseAtk + equipAtk) * masteryMult),
    defense: Math.floor((baseDef + equipDef) * masteryMult),
    speed: Math.floor((baseSpd + equipSpd) * masteryMult),
    critChance: char.baseCritChance ?? 15,
    critDamage: char.baseCritDamage ?? 1.5,
    role: (char.role ?? "dps") as RaidFighterInput["role"],
    ultimate,
    passiveAbility: char.passiveAbility ?? null,
    passive: char.passiveAbility?.name ?? null,
  };
}
