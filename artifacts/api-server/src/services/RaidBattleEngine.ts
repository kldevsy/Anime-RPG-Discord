/**
 * ========================================
 * RAID BATTLE ENGINE
 * ========================================
 *
 * Motor de batalha de raid — cópia direta do BattleEngine do arena
 * com suporte a waves e boss final.
 *
 * Diferenças em relação ao arena:
 *  - Recebe RaidFighterInput[] em vez de Combatant[]
 *  - Roda múltiplas waves (cada uma = uma batalha completa)
 *  - Boss final com fases automáticas (via isBoss + checkDeaths)
 *  - HP/energia/ultimate charge persistem entre waves
 *  - Recuperação de 30% HP entre waves
 *  - Tracking de dano por personagem para leaderboard
 */

import { randomInt } from "node:crypto";
import { chooseAction } from "../battle/AIController";
import { calculateDamage } from "../battle/DamageCalculator";
import { StatusManager } from "../battle/StatusManager";
import { SkillManager } from "../battle/SkillManager";
import { PassiveManager } from "../battle/PassiveManager";
import * as PassiveStackManager from "../battle/PassiveStackManager";
import type { BattleAction, BattlePhase, BattleSnapshot, Combatant } from "../battle/BattleState";
import type { PassiveContext } from "../battle/PassiveTypes";
import type { RaidMap, RaidBoss } from "@workspace/db/data/raid-catalog";
import { logger } from "../lib/logger";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ──────────────────────────────────────────────────────────────────────────────

export interface RaidFighterInput {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
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
  timeElapsed: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Multiplicadores de dificuldade
// ──────────────────────────────────────────────────────────────────────────────

const DIFF = {
  normal:    { hp: 1.0, atk: 1.0, def: 1.0 },
  hard:      { hp: 1.6, atk: 1.4, def: 1.3 },
  nightmare: { hp: 2.5, atk: 1.9, def: 1.7 },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Factory: RaidFighterInput → Combatant
// ──────────────────────────────────────────────────────────────────────────────

function makePlayerCombatant(f: RaidFighterInput, hp?: number): Combatant {
  return SkillManager.createCombatant({
    id: f.id,
    name: f.name,
    role: f.role,
    maxHp: f.maxHp,
    hp: hp ?? f.currentHp,
    attack: f.attack,
    defense: f.defense,
    speed: f.speed,
    critChance: f.critChance,
    critDamage: f.critDamage,
    ultimate: f.ultimate ?? null,
    passive: f.passive ?? undefined,
    passiveAbility: f.passiveAbility ?? undefined,
  });
}

function makeEnemy(id: string, name: string, hp: number, atk: number, def: number, spd: number, role: Combatant["role"] = "dps", diff: keyof typeof DIFF = "normal", isBoss = false, phases = 0): Combatant {
  const m = DIFF[diff];
  return SkillManager.createCombatant({
    id,
    name,
    role,
    maxHp: Math.floor(hp * m.hp),
    hp:    Math.floor(hp * m.hp),
    attack:  Math.floor(atk * m.atk),
    defense: Math.floor(def * m.def),
    speed:   spd,
    critChance: 10,
    critDamage: 1.5,
    isBoss,
    maxPhases: isBoss ? Math.max(phases, 1) : undefined,
    enrageRound: isBoss ? 8 : undefined,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Engine de uma batalha (wave OU boss) — cópia do BattleEngine do arena
// ──────────────────────────────────────────────────────────────────────────────

class WaveBattleEngine {
  private phase: BattlePhase = "WAITING";
  private round = 0;
  private turn = 0;
  private initiative: Combatant[] = [];
  private actions: BattleAction[] = [];
  private passiveManager: PassiveManager;

  constructor(
    private readonly playerTeam: Combatant[],
    private readonly enemyTeam: Combatant[],
  ) {
    this.passiveManager = new PassiveManager(0);
    [...playerTeam, ...enemyTeam].forEach(c => PassiveStackManager.initializePassiveStacks(c));
    this.triggerAll("on_battle_start");
  }

  async run(maxRounds = 80, onSnapshot?: (snap: BattleSnapshot) => Promise<void>): Promise<BattleSnapshot> {
    if (onSnapshot) {
      // Animated mode — envia snapshot a cada mudança de ação
      let lastActionCount = -1;
      for (let s = 0; s < maxRounds * 30 && !this.isFinished(); s++) {
        this.step();
        const snap = this.snapshot();
        if (snap.actions.length !== lastActionCount || this.isFinished()) {
          lastActionCount = snap.actions.length;
          await onSnapshot(snap);
        }
      }
      if (this.isFinished()) this.phase = this.resultPhase();
      else this.phase = "DRAW";
      await onSnapshot(this.snapshot());
      return this.snapshot();
    }
    // Sync mode (sem Discord)
    for (let s = 0; s < maxRounds * 30 && !this.isFinished(); s++) this.step();
    if (this.isFinished()) this.phase = this.resultPhase();
    else this.phase = "DRAW";
    return this.snapshot();
  }

  private step() {
    if (this.isFinished()) return;
    switch (this.phase) {
      case "WAITING":    this.phase = "PREPARING"; break;
      case "PREPARING":  this.phase = "INITIATIVE"; break;
      case "INITIATIVE": this.calcInit(); this.phase = "ROUND_START"; break;
      case "ROUND_START":
        this.round++;
        this.turn = 0;
        this.roundStart();
        this.phase = "CHARACTER_TURN";
        break;
      case "CHARACTER_TURN":
        this.phase = this.turn >= this.initiative.length ? "ROUND_END" : "ACTION";
        break;
      case "ACTION":        this.performTurn(); this.phase = "DAMAGE"; break;
      case "DAMAGE":        this.phase = "STATUS_PROCESS"; break;
      case "STATUS_PROCESS":this.phase = "DEATH_CHECK"; break;
      case "DEATH_CHECK":   this.checkDeaths(); this.phase = "NEXT_TURN"; break;
      case "NEXT_TURN":     this.turn++; this.phase = "CHARACTER_TURN"; break;
      case "ROUND_END":     this.roundEnd(); this.phase = this.isFinished() ? this.resultPhase() : "INITIATIVE"; break;
    }
  }

  private snapshot(): BattleSnapshot {
    return {
      phase: this.phase,
      round: this.round,
      turn: this.turn,
      initiative: this.initiative.map(u => u.name),
      playerTeam: structuredClone(this.playerTeam),
      enemyTeam: structuredClone(this.enemyTeam),
      actions: structuredClone(this.actions),
    };
  }

  private calcInit() {
    const all = [...this.playerTeam, ...this.enemyTeam].filter(u => u.alive);
    this.initiative = all.sort((a, b) =>
      (StatusManager.getEffectiveSpeed(b) + randomInt(-2, 3)) -
      (StatusManager.getEffectiveSpeed(a) + randomInt(-2, 3))
    );
  }

  private roundStart() {
    this.passiveManager.setRound(this.round);
    for (const u of [...this.playerTeam, ...this.enemyTeam]) {
      if (!u.alive) continue;
      PassiveStackManager.resetRoundActivations(u);
      PassiveStackManager.decrementPassiveCooldowns(u);
    }
    this.triggerAll("on_round_start");
    for (const u of [...this.playerTeam, ...this.enemyTeam]) {
      if (!u.alive) continue;
      this.triggerUnit(u, "on_turn_start");
      if (u.isBoss && !u.isEnraged) {
        const thr = u.enrageRound ?? 10;
        if (this.round >= thr || u.hp / u.maxHp <= 0.3) {
          u.isEnraged = true;
          StatusManager.applyStatus(u, { type: "attack_up", duration: 99, stacks: 1, value: 50, originId: u.id });
          StatusManager.applyStatus(u, { type: "speed_up", duration: 99, stacks: 1, value: 20, originId: u.id });
          this.actions.push({ round: this.round, actorId: u.id, actorName: u.name, type: "boss_enrage", amount: u.attack });
        }
      }
      for (const k of Object.keys(u.cooldowns)) if (u.cooldowns[k] > 0) u.cooldowns[k]--;
      this.addCharge(u, "turn_start");
      const { log } = StatusManager.processTurnStartDoTs(u);
      for (const e of log) this.actions.push({ round: this.round, actorId: u.id, actorName: u.name, type: "status_dot", amount: e.amount, statusType: e.type });
    }
  }

  private performTurn() {
    const actor = this.initiative[this.turn];
    if (!actor?.alive) return;
    if (StatusManager.isControlStunned(actor)) {
      this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: "status_applied", statusType: "stun" });
      return;
    }
    const allies = this.teamOf(actor);
    const enemies = allies === this.playerTeam ? this.enemyTeam : this.playerTeam;
    const selected = chooseAction(actor, allies, enemies);
    if (!selected) return;
    const { skill, actionKey, target } = selected;

    if (actionKey === "basic") this.triggerUnit(actor, "on_basic_attack", { target, allies, enemies });
    else if (actionKey === "ultimate") this.triggerUnit(actor, "on_ultimate_use", { target, allies, enemies });
    else this.triggerUnit(actor, "on_skill_use", { target, allies, enemies });

    actor.cooldowns[actionKey] = actionKey === "ultimate"
      ? (actor.skills.ultimate.chargePolicy.cooldown ?? skill.cooldown)
      : skill.cooldown;
    if (actionKey === "ultimate") this.resetCharge(actor);
    else if (actionKey !== "basic") actor.energy = Math.max(0, actor.energy - skill.energyCost);

    const targets = this.resolveTargets(skill, target, allies, enemies);
    const aType: BattleAction["type"] = actionKey === "basic" ? "basic_attack" : actionKey;

    for (const tgt of targets) {
      if (!tgt.alive && skill.type !== "REVIVE") continue;
      if (skill.type === "HEAL") {
        const amount = Math.min(tgt.maxHp - tgt.hp, Math.floor(StatusManager.getEffectiveAttack(actor) * skill.multiplier));
        tgt.hp += amount;
        this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: "heal", targetId: tgt.id, targetName: tgt.name, amount, skillName: skill.name, isHealing: true });
        if (skill.statusEffects) for (const eff of skill.statusEffects) if (randomInt(0, 100) < eff.chance) {
          StatusManager.applyStatus(tgt, { type: eff.type, duration: eff.duration, stacks: 1, value: eff.value, originId: actor.id });
          this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: eff.type === "shield" ? "shield" : "buff", targetId: tgt.id, targetName: tgt.name, amount: eff.value, statusType: eff.type, skillName: skill.name });
        }
      } else if (skill.type === "REVIVE") {
        if (!tgt.alive) { tgt.alive = true; tgt.hp = Math.floor(tgt.maxHp * 0.5); this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: "revive", targetId: tgt.id, targetName: tgt.name, amount: tgt.hp, skillName: skill.name }); }
      } else if (skill.type === "SHIELD" || skill.type === "BUFF") {
        if (skill.statusEffects) for (const eff of skill.statusEffects) if (randomInt(0, 100) < eff.chance) {
          StatusManager.applyStatus(tgt, { type: eff.type, duration: eff.duration, stacks: 1, value: eff.value, originId: actor.id });
          this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: skill.type === "SHIELD" ? "shield" : "buff", targetId: tgt.id, targetName: tgt.name, amount: eff.value, statusType: eff.type, skillName: skill.name });
        }
      } else {
        const dmg = calculateDamage(actor, tgt, skill, randomInt(0, 100));
        const pCtx: PassiveContext = { owner: actor, trigger: "on_hit", round: this.round, actor, target: tgt, damage: dmg.finalDamage, isCritical: dmg.critical, modifiedDamage: dmg.finalDamage, allies, enemies };
        this.triggerUnit(actor, "on_hit", pCtx);
        if (dmg.critical) this.triggerUnit(actor, "on_critical_hit", pCtx);
        const tCtx: PassiveContext = { owner: tgt, trigger: "on_damaged", round: this.round, actor, target: tgt, damage: pCtx.modifiedDamage ?? dmg.finalDamage, isCritical: dmg.critical, modifiedDamage: pCtx.modifiedDamage ?? dmg.finalDamage, allies: enemies, enemies: allies };
        this.triggerUnit(tgt, "on_damaged", tCtx);
        this.triggerUnit(tgt, "on_hit_taken", tCtx);
        if (dmg.critical) this.triggerUnit(tgt, "on_critical_taken", tCtx);
        const actual = tCtx.modifiedDamage ?? dmg.finalDamage;
        tgt.hp = Math.max(0, tgt.hp - actual);
        if (actual > 0) {
          if (actionKey === "basic") this.addCharge(actor, "basic_hit");
          this.addCharge(actor, "damage_dealt");
          this.addCharge(tgt, "damage_received");
          if (dmg.critical) this.addCharge(actor, "critical_hit");
          if (tgt.hp === 0) { this.addCharge(actor, "defeat"); this.triggerUnit(actor, "on_kill", { target: tgt, allies, enemies }); }
        }
        this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: aType, targetId: tgt.id, targetName: tgt.name, amount: actual, critical: dmg.critical, skillName: skill.name, isHealing: false });
        if (skill.statusEffects && tgt.alive) for (const eff of skill.statusEffects) if (randomInt(0, 100) < eff.chance) {
          StatusManager.applyStatus(tgt, { type: eff.type, duration: eff.duration, stacks: 1, value: eff.value, originId: actor.id });
          this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: "status_applied", targetId: tgt.id, targetName: tgt.name, statusType: eff.type });
        }
      }
    }
  }

  private roundEnd() {
    for (const u of [...this.playerTeam, ...this.enemyTeam]) if (u.alive) StatusManager.decrementDurations(u);
  }

  private checkDeaths() {
    for (const u of [...this.playerTeam, ...this.enemyTeam]) {
      if (u.hp <= 0) {
        if (u.alive) {
          const allies = this.teamOf(u);
          const enemies = allies === this.playerTeam ? this.enemyTeam : this.playerTeam;
          this.triggerUnit(u, "on_death", { allies, enemies });
          for (const a of allies) if (a.id !== u.id && a.alive) this.triggerUnit(a, "on_ally_defeated", { target: u, allies, enemies });
          for (const e of enemies) if (e.alive) this.triggerUnit(e, "on_enemy_defeated", { target: u, allies: enemies, enemies: allies });
        }
        if (u.isBoss && u.currentPhase && u.maxPhases && u.currentPhase < u.maxPhases) {
          u.currentPhase++;
          u.maxHp = Math.floor(u.maxHp * 1.25);
          u.hp = u.maxHp;
          u.attack = Math.floor(u.attack * 1.3);
          u.defense = Math.floor(u.defense * 1.2);
          u.statusEffects = u.statusEffects.filter(s => ["attack_up","defense_up","speed_up","shield"].includes(s.type));
          u.alive = true;
          this.actions.push({ round: this.round, actorId: u.id, actorName: u.name, type: "boss_phase_change", amount: u.currentPhase });
        } else {
          u.hp = 0;
          if (u.alive) {
            u.alive = false;
            this.actions.push({ round: this.round, actorId: "system", actorName: u.name, type: "defeat", targetId: u.id, targetName: u.name });
          }
        }
      }
    }
  }

  private resolveTargets(skill: { targetType: string; type?: string }, primary: Combatant, allies: Combatant[], enemies: Combatant[]): Combatant[] {
    switch (skill.targetType) {
      case "aoe_enemy": return enemies.filter(u => u.alive);
      case "aoe_ally":  return skill.type === "REVIVE" ? allies : allies.filter(u => u.alive);
      case "self":      return [primary];
      default:          return primary ? [primary] : [];
    }
  }

  addCharge(unit: Combatant, source: import("../battle/BattleState").UltimateChargeSource, override?: number) {
    const policy = unit.skills.ultimate.chargePolicy;
    const base = override ?? ({ turn_start: policy.onTurnStart, basic_hit: policy.onBasicHit, damage_dealt: policy.onDamageDealt, damage_received: policy.onDamageReceived, critical_hit: policy.onCriticalHit, defeat: policy.onDefeat }[source] ?? 0);
    if (base <= 0) return;
    const prev = unit.ultimateCharge;
    const final = Math.min(unit.ultimateChargeRequired, prev + base);
    unit.ultimateCharge = final;
    unit.ultimateReady = final >= unit.ultimateChargeRequired;
    unit.ultimateChargeTelemetry.push({ source, previous: prev, delta: final - prev, final, round: this.round });
    this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "ultimate_charge", chargeSource: source, previousCharge: prev, chargeDelta: final - prev, finalCharge: final });
    if (prev < unit.ultimateChargeRequired && unit.ultimateReady) this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "ultimate_ready", chargeSource: source, previousCharge: prev, chargeDelta: final - prev, finalCharge: final });
  }

  private resetCharge(unit: Combatant) {
    const prev = unit.ultimateCharge;
    unit.ultimateCharge = 0;
    unit.ultimateReady = false;
    unit.ultimateChargeTelemetry.push({ source: "ultimate_used", previous: prev, delta: -prev, final: 0, round: this.round });
    this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "ultimate_used", chargeSource: "ultimate_used", previousCharge: prev, chargeDelta: -prev, finalCharge: 0, skillName: unit.skills.ultimate.name });
  }

  private teamOf(actor: Combatant) { return this.playerTeam.includes(actor) ? this.playerTeam : this.enemyTeam; }
  private isFinished() { return !this.playerTeam.some(u => u.alive) || !this.enemyTeam.some(u => u.alive); }
  private resultPhase(): BattlePhase {
    if (this.playerTeam.some(u => u.alive) && !this.enemyTeam.some(u => u.alive)) return "VICTORY";
    if (!this.playerTeam.some(u => u.alive)) return "DEFEAT";
    return "DRAW";
  }
  private triggerAll(trigger: import("../battle/PassiveTypes").PassiveTrigger) {
    for (const u of [...this.playerTeam, ...this.enemyTeam]) if (u.alive) this.triggerUnit(u, trigger);
  }
  private triggerUnit(unit: Combatant, trigger: import("../battle/PassiveTypes").PassiveTrigger, extra?: Partial<PassiveContext>) {
    if (!unit.passiveAbility) return;
    const allies = this.teamOf(unit);
    const enemies = allies === this.playerTeam ? this.enemyTeam : this.playerTeam;
    const ctx: PassiveContext = { owner: unit, trigger, round: this.round, allies, enemies, ...extra };
    if (!PassiveStackManager.canActivatePassive(unit, unit.passiveAbility)) return;
    const tHp = extra?.target ? (extra.target.hp / extra.target.maxHp) * 100 : undefined;
    if (!PassiveStackManager.checkPassiveConditions(unit, unit.passiveAbility, { targetHpPercent: tHp, isFirstRound: this.round === 1, isCritical: (extra as any)?.isCritical })) return;
    if (unit.passiveAbility.stackCounter) {
      const fire = PassiveStackManager.incrementPassiveStack(unit, unit.passiveAbility.id);
      if (fire && unit.passiveAbility.stackEffect) {
        this.applyPassiveEffect(unit, unit.passiveAbility.stackEffect, ctx);
        this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "passive_trigger" as any, skillName: `${unit.passiveAbility.name} (Stack Effect)` });
        if (unit.passiveAbility.cooldownRounds) PassiveStackManager.startPassiveCooldown(unit, unit.passiveAbility.id, unit.passiveAbility.cooldownRounds);
      }
      if (unit.passiveAbility.stackEffect && !unit.passiveAbility.effects?.length) return;
    }
    if (unit.passiveAbility.stackLimit && trigger === "on_damaged") PassiveStackManager.addProgressiveStack(unit, unit.passiveAbility.id);
    this.passiveManager.processTrigger(ctx, this.actions);
    PassiveStackManager.recordPassiveActivation(unit, unit.passiveAbility.id);
    if (unit.passiveAbility.conditionalEffects) for (const eff of unit.passiveAbility.conditionalEffects) this.applyPassiveEffect(unit, eff, ctx);
  }
  private applyPassiveEffect(owner: Combatant, effect: any, ctx: PassiveContext) {
    const tgt = ctx.target ?? owner;
    switch (effect.type) {
      case "apply_status":
        if (effect.chance && Math.random() * 100 > effect.chance) break;
        if (effect.statusType) StatusManager.applyStatus(tgt, { type: effect.statusType, duration: effect.duration ?? 1, stacks: 1, value: effect.value ?? 0, originId: owner.id });
        break;
      case "increase_crit_chance": owner.critChance += effect.value ?? 0; break;
      case "gain_ultimate_charge": this.addCharge(owner, "turn_start", effect.value); break;
    }
  }

  /** Exporta estado dos jogadores para persistir entre waves */
  getPlayerState(): Combatant[] { return structuredClone(this.playerTeam); }

  /** Dano total causado por cada player nesta wave */
  getDamageByPlayer(): Record<string, number> {
    const dmg: Record<string, number> = {};
    for (const a of this.actions) {
      if (!["basic_attack","skill1","skill2","ultimate"].includes(a.type)) continue;
      if (!this.playerTeam.some(p => p.id === a.actorId)) continue;
      dmg[a.actorId] = (dmg[a.actorId] ?? 0) + (a.amount ?? 0);
    }
    return dmg;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Classe principal da raid
// ──────────────────────────────────────────────────────────────────────────────

export class RaidBattleEngine {
  private log: string[] = [];
  private dmg: Record<string, number> = {};
  private startMs = Date.now();
  /** Combatants persistentes (HP/status carregam entre waves) */
  private players: Combatant[];

  constructor(
    private readonly raidMap: RaidMap,
    private readonly difficulty: "normal" | "hard" | "nightmare",
    fighters: RaidFighterInput[],
  ) {
    this.players = fighters.map(f => makePlayerCombatant(f));
    for (const f of fighters) this.dmg[f.id] = 0;
  }

  async executeRaid(
    onWaveSnapshot?: (waveNum: number, totalWaves: number, snap: BattleSnapshot, isBoss: boolean) => Promise<void>
  ): Promise<RaidBattleResult> {
    logger.info(`[RAID BATTLE] Starting raid: ${this.raidMap.name} (${this.difficulty})`);

    // ── Waves ──────────────────────────────────────────────────────────────
    for (let i = 0; i < this.raidMap.waves.length; i++) {
      const wave = this.raidMap.waves[i];
      this.emit(`\n━━━━━━━━━━━━━━━━━━━━━━`);
      this.emit(`⚔️ **WAVE ${wave.wave}/${this.raidMap.waves.length}**`);
      if (wave.environmentEffect) this.emit(`🌍 Efeito: ${wave.environmentEffect.description}`);

      // Criar inimigos da wave com dificuldade
      const enemies: Combatant[] = wave.enemies.map((e, idx) =>
        makeEnemy(`w${wave.wave}_e${idx}`, e.name, e.hp, e.attack, e.defense, e.speed, e.role ?? "dps", this.difficulty)
      );

      const alive = this.players.filter(p => p.alive);
      if (alive.length === 0) return this.result(false, wave.wave);

      // Rodar batalha da wave
      const engine = new WaveBattleEngine(alive, enemies);
      const snap = await engine.run(60, onWaveSnapshot
        ? (s) => onWaveSnapshot(wave.wave, this.raidMap.waves.length, s, false)
        : undefined
      );

      // Aplicar efeito de ambiente nos sobreviventes
      if (wave.environmentEffect && (wave.environmentEffect.type === "burn" || wave.environmentEffect.type === "poison")) {
        for (const p of alive) if (p.alive) p.hp = Math.max(1, p.hp - wave.environmentEffect.value);
      }

      // Sincronizar HP/alive de volta
      this.syncPlayers(engine.getPlayerState());

      // Acumular dano
      for (const [id, d] of Object.entries(engine.getDamageByPlayer())) this.dmg[id] = (this.dmg[id] ?? 0) + d;

      if (snap.phase !== "VICTORY") {
        logger.info(`[RAID BATTLE] Defeat at wave ${wave.wave}`);
        this.emit(`💀 **Derrota na wave ${wave.wave}!**`);
        return this.result(false, wave.wave);
      }

      const survivors = this.players.filter(p => p.alive).length;
      this.emit(`✅ Wave ${wave.wave} concluída! Sobreviventes: ${survivors}/${this.players.length}`);

      // Recuperação entre waves (não na última wave antes do boss)
      if (i < this.raidMap.waves.length - 1) {
        for (const p of this.players) if (p.alive) p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.30));
        this.emit(`💚 Time recuperou 30% HP.`);
      }
    }

    // ── Boss ───────────────────────────────────────────────────────────────
    const boss = this.raidMap.boss;
    this.emit(`\n━━━━━━━━━━━━━━━━━━━━━━`);
    this.emit(`💀 **BOSS: ${boss.name}** — ${boss.title}`);
    this.emit(`━━━━━━━━━━━━━━━━━━━━━━`);

    const bossSpeed = (boss as any).speed ?? 90;
    const bossCombatant = makeEnemy(
      "boss", boss.name, boss.hp, boss.attack, boss.defense, bossSpeed,
      "dps", this.difficulty,
      true,                          // isBoss → ativa enrage automático
      boss.phases?.length ?? 1,      // número de fases
    );

    const aliveForBoss = this.players.filter(p => p.alive);
    if (aliveForBoss.length === 0) return this.result(false, this.raidMap.waves.length + 1);

    const bossEngine = new WaveBattleEngine(aliveForBoss, [bossCombatant]);
    const bossSnap = await bossEngine.run(120, onWaveSnapshot
      ? (s) => onWaveSnapshot(this.raidMap.waves.length + 1, this.raidMap.waves.length + 1, s, true)
      : undefined
    );

    this.syncPlayers(bossEngine.getPlayerState());
    for (const [id, d] of Object.entries(bossEngine.getDamageByPlayer())) this.dmg[id] = (this.dmg[id] ?? 0) + d;

    if (bossSnap.phase !== "VICTORY") {
      this.emit(`💀 **Time eliminado pelo boss!**`);
      return this.result(false, this.raidMap.waves.length + 1);
    }

    this.emit(`🎉 **${boss.name} derrotado! RAID COMPLETA!** 🎉`);
    return this.result(true, this.raidMap.waves.length + 1);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private syncPlayers(updated: Combatant[]) {
    for (const u of updated) {
      const p = this.players.find(x => x.id === u.id);
      if (p) { p.hp = u.hp; p.alive = u.alive; p.statusEffects = u.statusEffects; p.ultimateCharge = u.ultimateCharge; }
    }
  }

  private emit(msg: string) { this.log.push(msg); }

  private result(victory: boolean, waveReached: number): RaidBattleResult {
    return {
      victory,
      waveReached,
      totalWaves: this.raidMap.waves.length + 1,
      battleLog: this.log,
      survivors: this.players.map(p => ({ id: p.id, name: p.name, hp: p.hp, alive: p.alive })),
      casualties: this.players.filter(p => !p.alive).map(p => p.name),
      damageByCharacter: this.dmg,
      timeElapsed: Math.floor((Date.now() - this.startMs) / 1000),
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory pública: dados do DB → RaidFighterInput
// ──────────────────────────────────────────────────────────────────────────────

export function createRaidFighterFromCharacter(
  userChar: { id: string; level: number; masteryLevel?: number | null },
  char: { name: string; baseHp: number; baseAttack: number; baseDefense: number; baseSpeed: number; baseCritChance?: number | null; baseCritDamage?: number | null; role: string; passiveAbility?: any; ultimates?: any[] },
  equip?: { attackBonus?: number | null; defenseBonus?: number | null; hpBonus?: number | null; speedBonus?: number | null } | null,
): RaidFighterInput {
  const lvl = userChar.level ?? 1;
  const mst = userChar.masteryLevel ?? 1;
  const mm = 1 + (mst - 1) * 0.05;

  const hp  = Math.floor((char.baseHp      + lvl * 10  + (equip?.hpBonus      ?? 0)) * mm);
  const atk = Math.floor((char.baseAttack  + lvl * 5   + (equip?.attackBonus  ?? 0)) * mm);
  const def = Math.floor((char.baseDefense + lvl * 3   + (equip?.defenseBonus ?? 0)) * mm);
  const spd = Math.floor((char.baseSpeed   + lvl * 0.5 + (equip?.speedBonus   ?? 0)) * mm);

  return {
    id: userChar.id,
    name: char.name,
    maxHp: hp,
    currentHp: hp,
    attack: atk,
    defense: def,
    speed: spd,
    critChance: char.baseCritChance ?? 15,
    critDamage: char.baseCritDamage ?? 1.5,
    role: (char.role ?? "dps") as RaidFighterInput["role"],
    ultimate: char.ultimates?.[0] ?? null,
    passiveAbility: char.passiveAbility ?? null,
    passive: char.passiveAbility?.name ?? null,
  };
}
