import { randomInt } from "node:crypto";
import { chooseAction } from "./AIController";
import { calculateDamage } from "./DamageCalculator";
import { StatusManager } from "./StatusManager";
import type { BattleAction, BattlePhase, BattleSnapshot, Combatant, UltimateDecision, UltimateDecisionProvider } from "./BattleState";

export class BattleEngine {
  private phase: BattlePhase = "WAITING";
  private round = 0;
  private turn = 0;
  private initiative: Combatant[] = [];
  private actions: BattleAction[] = [];
  private pendingUltimateDecision: UltimateDecision | null = null;

  constructor(private readonly playerTeam: Combatant[], private readonly enemyTeam: Combatant[]) {}

  snapshot(): BattleSnapshot {
    return {
      phase: this.phase,
      round: this.round,
      turn: this.turn,
      initiative: this.initiative.map((unit) => unit.name),
      playerTeam: structuredClone(this.playerTeam),
      enemyTeam: structuredClone(this.enemyTeam),
      actions: structuredClone(this.actions),
    };
  }

  run(maxRounds = 100): BattleSnapshot {
    for (let step = 0; step < maxRounds * 30 && !this.isFinished(); step += 1) {
      this.step();
    }
    if (this.isFinished()) this.phase = this.resultPhase();
    else this.phase = "DRAW";
    return this.snapshot();
  }

  async runAnimated(onSnapshot: (snapshot: BattleSnapshot) => Promise<void> | void, maxRounds = 100, ultimateDecisionProvider?: UltimateDecisionProvider): Promise<BattleSnapshot> {
    let snapshot = this.snapshot();
    let lastActionCount = -1;
    await onSnapshot(snapshot);

    for (let step = 0; step < maxRounds * 30 && !this.isFinished(); step += 1) {
      // Decisions are requested only at the authoritative ACTION state. The
      // provider may be a Discord interaction, but the engine still validates
      // every id against this in-memory server state before spending charge.
      if (this.phase === "ACTION") {
        const actor = this.initiative[this.turn];
        if (actor && this.playerTeam.includes(actor) && actor.alive && actor.ultimateReady && ultimateDecisionProvider) {
          this.pendingUltimateDecision = await ultimateDecisionProvider({
            snapshot: this.snapshot(), actor: structuredClone(actor), validTargets: this.validUltimateTargets(actor).map((target) => structuredClone(target)),
          });
        }
      }
      snapshot = this.step();
      if (snapshot.actions.length !== lastActionCount || this.isFinished()) {
        lastActionCount = snapshot.actions.length;
        await onSnapshot(snapshot);
      }
    }

    this.phase = this.isFinished() ? this.resultPhase() : "DRAW";
    snapshot = this.snapshot();
    await onSnapshot(snapshot);
    return snapshot;
  }

  step(): BattleSnapshot {
    if (this.isFinished()) return this.snapshot();
    switch (this.phase) {
      case "WAITING":
        this.phase = "PREPARING";
        break;
      case "PREPARING":
        this.phase = "INITIATIVE";
        break;
      case "INITIATIVE":
        this.calculateInitiative();
        this.phase = "ROUND_START";
        break;
      case "ROUND_START":
        this.round += 1;
        this.turn = 0;
        this.processRoundStart();
        this.phase = "CHARACTER_TURN";
        break;
      case "CHARACTER_TURN":
        if (this.turn >= this.initiative.length) {
          this.phase = "ROUND_END";
        } else {
          this.phase = "ACTION";
        }
        break;
      case "ACTION":
        this.performTurn();
        this.phase = "DAMAGE";
        break;
      case "DAMAGE":
        this.phase = "STATUS_PROCESS";
        break;
      case "STATUS_PROCESS":
        this.phase = "DEATH_CHECK";
        break;
      case "DEATH_CHECK":
        this.checkDeaths();
        this.phase = "NEXT_TURN";
        break;
      case "NEXT_TURN":
        this.turn += 1;
        this.phase = "CHARACTER_TURN";
        break;
      case "ROUND_END":
        this.processRoundEnd();
        this.phase = this.isFinished() ? this.resultPhase() : "INITIATIVE";
        break;
      default:
        break;
    }
    return this.snapshot();
  }

  private calculateInitiative() {
    const allAlive = [...this.playerTeam, ...this.enemyTeam].filter((unit) => unit.alive);
    this.initiative = allAlive.sort((a, b) => {
      const speedA = StatusManager.getEffectiveSpeed(a) + randomInt(-2, 3);
      const speedB = StatusManager.getEffectiveSpeed(b) + randomInt(-2, 3);
      return speedB - speedA;
    });
  }

  private processRoundStart() {
    for (const unit of [...this.playerTeam, ...this.enemyTeam]) {
      if (!unit.alive) continue;
      if (unit.isBoss && !unit.isEnraged) {
        const enrageRoundThreshold = unit.enrageRound ?? 10;
        if (this.round >= enrageRoundThreshold || (unit.hp / unit.maxHp) <= 0.3) {
          unit.isEnraged = true;
          StatusManager.applyStatus(unit, { type: "attack_up", duration: 99, stacks: 1, value: 50, originId: unit.id });
          StatusManager.applyStatus(unit, { type: "speed_up", duration: 99, stacks: 1, value: 20, originId: unit.id });
          this.actions.push({
            round: this.round,
            actorId: unit.id,
            actorName: unit.name,
            type: "boss_enrage",
            amount: unit.attack,
          });
        }
      }
      for (const key of Object.keys(unit.cooldowns)) {
        if (unit.cooldowns[key] > 0) unit.cooldowns[key] -= 1;
      }
      this.addUltimateCharge(unit, "turn_start");
      const { damage, log } = StatusManager.processTurnStartDoTs(unit);
      for (const entry of log) {
        this.actions.push({
          round: this.round,
          actorId: unit.id,
          actorName: unit.name,
          type: "status_dot",
          amount: entry.amount,
          statusType: entry.type,
        });
      }
    }
  }

  private performTurn() {
    const actor = this.initiative[this.turn];
    if (!actor || !actor.alive) return;

    if (StatusManager.isControlStunned(actor)) {
      this.actions.push({
        round: this.round,
        actorId: actor.id,
        actorName: actor.name,
        type: "status_applied",
        statusType: "stun",
      });
      return;
    }

    const allies = this.teamOf(actor);
    const enemies = allies === this.playerTeam ? this.enemyTeam : this.playerTeam;

    const selected = this.pendingUltimateDecision?.useUltimate
      ? this.selectionFromUltimateDecision(this.pendingUltimateDecision, actor)
      : chooseAction(actor, allies, enemies);
    this.pendingUltimateDecision = null;
    if (!selected) return;

    const { skill, actionKey, target } = selected;
    actor.cooldowns[actionKey] = actionKey === "ultimate"
      ? (actor.skills.ultimate.chargePolicy.cooldown ?? skill.cooldown)
      : skill.cooldown;

    if (actionKey === "ultimate") {
      this.resetUltimateCharge(actor);
    } else if (actionKey !== "basic") {
      actor.energy = Math.max(0, actor.energy - skill.energyCost);
    }

    const targets = this.determineSkillTargets(skill, target, allies, enemies);
    const actionType: BattleAction["type"] = actionKey === "basic" ? "basic_attack" : actionKey;

    for (const tgt of targets) {
      if (!tgt.alive && skill.type !== "REVIVE") continue;

      if (skill.type === "HEAL") {
        const healAmount = Math.floor(StatusManager.getEffectiveAttack(actor) * skill.multiplier);
        const actualHeal = Math.min(tgt.maxHp - tgt.hp, healAmount);
        tgt.hp += actualHeal;
        this.actions.push({
          round: this.round,
          actorId: actor.id,
          actorName: actor.name,
          type: "heal",
          targetId: tgt.id,
          targetName: tgt.name,
          amount: actualHeal,
          skillName: skill.name,
          isHealing: actionKey === "ultimate",
        });
        if (skill.statusEffects) {
          for (const eff of skill.statusEffects) {
            if (randomInt(0, 100) < eff.chance) {
              StatusManager.applyStatus(tgt, { type: eff.type, duration: eff.duration, stacks: 1, value: eff.value, originId: actor.id });
              this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: eff.type === "shield" ? "shield" : "buff", targetId: tgt.id, targetName: tgt.name, amount: eff.value, statusType: eff.type, skillName: skill.name });
            }
          }
        }
      } else if (skill.type === "REVIVE") {
        if (!tgt.alive) {
          tgt.alive = true;
          tgt.hp = Math.floor(tgt.maxHp * 0.5);
          this.actions.push({
            round: this.round,
            actorId: actor.id,
            actorName: actor.name,
            type: "revive",
            targetId: tgt.id,
            targetName: tgt.name,
            amount: tgt.hp,
            skillName: skill.name,
          });
        }
      } else if (skill.type === "SHIELD" || skill.type === "BUFF") {
        if (skill.statusEffects) {
          for (const eff of skill.statusEffects) {
            if (randomInt(0, 100) < eff.chance) {
              StatusManager.applyStatus(tgt, {
                type: eff.type,
                duration: eff.duration,
                stacks: 1,
                value: eff.value,
                originId: actor.id,
              });
              this.actions.push({
                round: this.round,
                actorId: actor.id,
                actorName: actor.name,
                type: skill.type === "SHIELD" ? "shield" : "buff",
                targetId: tgt.id,
                targetName: tgt.name,
                amount: eff.value,
                statusType: eff.type,
                skillName: skill.name,
              });
            }
          }
        }
      } else {
        const critRoll = randomInt(0, 100);
        const dmgResult = calculateDamage(actor, tgt, skill, critRoll);

        tgt.hp = Math.max(0, tgt.hp - dmgResult.finalDamage);
        if (dmgResult.finalDamage > 0) {
          if (actionKey === "basic") this.addUltimateCharge(actor, "basic_hit");
          this.addUltimateCharge(actor, "damage_dealt");
          this.addUltimateCharge(tgt, "damage_received");
          if (dmgResult.critical) this.addUltimateCharge(actor, "critical_hit");
          if (tgt.hp === 0) this.addUltimateCharge(actor, "defeat");
        }

        this.actions.push({
          round: this.round,
          actorId: actor.id,
          actorName: actor.name,
          type: actionType,
          targetId: tgt.id,
          targetName: tgt.name,
          amount: dmgResult.finalDamage,
          critical: dmgResult.critical,
          skillName: skill.name,
          isHealing: false,
        });

        if (skill.statusEffects && tgt.alive) {
          for (const eff of skill.statusEffects) {
            if (randomInt(0, 100) < eff.chance) {
              StatusManager.applyStatus(tgt, {
                type: eff.type,
                duration: eff.duration,
                stacks: 1,
                value: eff.value,
                originId: actor.id,
              });
              this.actions.push({
                round: this.round,
                actorId: actor.id,
                actorName: actor.name,
                type: "status_applied",
                targetId: tgt.id,
                targetName: tgt.name,
                statusType: eff.type,
              });
            }
          }
        }
      }
    }
  }

  /** Returns targets that this actor may legally select for its ultimate. */
  validUltimateTargets(actor: Combatant): Combatant[] {
    const allies = this.teamOf(actor);
    const enemies = allies === this.playerTeam ? this.enemyTeam : this.playerTeam;
    const ultimate = actor.skills.ultimate;
    if (ultimate.targetType === "self") return actor.alive ? [actor] : [];
    if (ultimate.targetType === "single_enemy" || ultimate.targetType === "aoe_enemy") return enemies.filter((unit) => unit.alive);
    if (ultimate.targetType === "single_ally") return allies.filter((unit) => ultimate.type === "REVIVE" ? !unit.alive : unit.alive);
    return ultimate.type === "REVIVE" ? allies : allies.filter((unit) => unit.alive);
  }

  /**
   * Server-side gate for user supplied decisions. IDs from Discord/API clients
   * are never trusted: the actor must be the current living player actor with
   * an unused ready charge and the target must match the ultimate target type.
   */
  validateUltimateDecision(decision: UltimateDecision, actor = this.initiative[this.turn]): { ok: true; target: Combatant } | { ok: false; error: string } {
    if (!decision.useUltimate) return { ok: false, error: "Ultimate was not requested." };
    if (!actor || !actor.alive) return { ok: false, error: "Actor is not alive or is not taking this turn." };
    if (!this.playerTeam.includes(actor) || actor.id !== decision.actorId) return { ok: false, error: "Actor does not belong to the player or is not the current actor." };
    if (!actor.ultimateReady || actor.ultimateCharge < actor.ultimateChargeRequired) return { ok: false, error: "Ultimate charge is not ready." };
    if ((actor.cooldowns.ultimate ?? 0) > 0) return { ok: false, error: "Ultimate is on cooldown." };
    const targets = this.validUltimateTargets(actor);
    const target = targets.find((unit) => unit.id === (decision.targetId ?? (actor.skills.ultimate.targetType === "self" ? actor.id : "")));
    if (!target) return { ok: false, error: "Ultimate target is invalid." };
    return { ok: true, target };
  }

  private selectionFromUltimateDecision(decision: UltimateDecision, actor: Combatant) {
    const result = this.validateUltimateDecision(decision, actor);
    if (!result.ok) return chooseAction(actor, this.playerTeam, this.enemyTeam);
    return { skill: actor.skills.ultimate, actionKey: "ultimate" as const, target: result.target };
  }

  private determineSkillTargets(
    skill: { targetType: string; type?: string },
    primaryTarget: Combatant,
    allies: Combatant[],
    enemies: Combatant[]
  ): Combatant[] {
    switch (skill.targetType) {
      case "aoe_enemy":
        return enemies.filter((u) => u.alive);
      case "aoe_ally":
        return skill.type === "REVIVE" ? allies : allies.filter((u) => u.alive);
      case "self":
        return [primaryTarget];
      case "single_ally":
      case "single_enemy":
      default:
        return primaryTarget ? [primaryTarget] : [];
    }
  }

  /** Centralized, capped charge mutation so snapshots can explain every trigger. */
  addUltimateCharge(unit: Combatant, source: import("./BattleState").UltimateChargeSource) {
    const policy = unit.skills.ultimate.chargePolicy;
    const configured = {
      turn_start: policy.onTurnStart,
      basic_hit: policy.onBasicHit,
      damage_dealt: policy.onDamageDealt,
      damage_received: policy.onDamageReceived,
      critical_hit: policy.onCriticalHit,
      defeat: policy.onDefeat,
    }[source] ?? 0;
    if (configured <= 0) return;

    const previous = unit.ultimateCharge;
    const final = Math.min(unit.ultimateChargeRequired, previous + configured);
    const delta = final - previous;
    unit.ultimateCharge = final;
    unit.ultimateReady = final >= unit.ultimateChargeRequired;
    unit.ultimateChargeTelemetry.push({ source, previous, delta, final, round: this.round });
    this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "ultimate_charge", ultimateKey: unit.skills.ultimate.stableKey, chargeSource: source, previousCharge: previous, chargeDelta: delta, finalCharge: final });
    if (previous < unit.ultimateChargeRequired && unit.ultimateReady) {
      this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "ultimate_ready", ultimateKey: unit.skills.ultimate.stableKey, chargeSource: source, previousCharge: previous, chargeDelta: delta, finalCharge: final });
    }
  }

  private resetUltimateCharge(unit: Combatant) {
    const previous = unit.ultimateCharge;
    unit.ultimateCharge = 0;
    unit.ultimateReady = false;
    unit.ultimateChargeTelemetry.push({ source: "ultimate_used", previous, delta: -previous, final: 0, round: this.round });
    this.actions.push({ round: this.round, actorId: unit.id, actorName: unit.name, type: "ultimate_used", ultimateKey: unit.skills.ultimate.stableKey, chargeSource: "ultimate_used", previousCharge: previous, chargeDelta: -previous, finalCharge: 0, skillName: unit.skills.ultimate.name });
  }

  private processRoundEnd() {
    for (const unit of [...this.playerTeam, ...this.enemyTeam]) {
      if (unit.alive) {
        StatusManager.decrementDurations(unit);
      }
    }
  }

  private teamOf(actor: Combatant) {
    return this.playerTeam.includes(actor) ? this.playerTeam : this.enemyTeam;
  }

  private checkDeaths() {
    for (const unit of [...this.playerTeam, ...this.enemyTeam]) {
      if (unit.hp <= 0) {
        if (unit.isBoss && unit.currentPhase && unit.maxPhases && unit.currentPhase < unit.maxPhases) {
          unit.currentPhase += 1;
          unit.maxHp = Math.floor(unit.maxHp * 1.2);
          unit.hp = unit.maxHp;
          unit.attack = Math.floor(unit.attack * 1.25);
          unit.defense = Math.floor(unit.defense * 1.2);
          unit.statusEffects = unit.statusEffects.filter((s) => s.type === "attack_up" || s.type === "defense_up" || s.type === "speed_up" || s.type === "shield");
          unit.alive = true;
          this.actions.push({
            round: this.round,
            actorId: unit.id,
            actorName: unit.name,
            type: "boss_phase_change",
            amount: unit.currentPhase,
          });
        } else {
          unit.hp = 0;
          if (unit.alive) {
            unit.alive = false;
            this.actions.push({
              round: this.round,
              actorId: "system",
              actorName: unit.name,
              type: "defeat",
              targetId: unit.id,
              targetName: unit.name,
            });
          }
        }
      }
    }
  }

  private isFinished() {
    return !this.playerTeam.some((unit) => unit.alive) || !this.enemyTeam.some((unit) => unit.alive);
  }

  private resultPhase(): BattlePhase {
    if (this.playerTeam.some((unit) => unit.alive) && !this.enemyTeam.some((unit) => unit.alive)) {
      return "VICTORY";
    }
    if (this.enemyTeam.some((unit) => unit.alive) && !this.playerTeam.some((unit) => unit.alive)) {
      return "DEFEAT";
    }
    return "DRAW";
  }
}
