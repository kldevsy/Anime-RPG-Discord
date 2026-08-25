import { randomInt } from "node:crypto";
import { chooseAction } from "./AIController";
import { calculateDamage } from "./DamageCalculator";
import { StatusManager } from "./StatusManager";
import type { BattleAction, BattlePhase, BattleSnapshot, Combatant } from "./BattleState";

export class BattleEngine {
  private phase: BattlePhase = "WAITING";
  private round = 0;
  private turn = 0;
  private initiative: Combatant[] = [];
  private actions: BattleAction[] = [];

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

  async runAnimated(onSnapshot: (snapshot: BattleSnapshot) => Promise<void> | void, maxRounds = 100): Promise<BattleSnapshot> {
    let snapshot = this.snapshot();
    let lastActionCount = -1;
    await onSnapshot(snapshot);

    for (let step = 0; step < maxRounds * 30 && !this.isFinished(); step += 1) {
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

    const selected = chooseAction(actor, allies, enemies);
    if (!selected) return;

    const { skill, actionKey, target } = selected;
    actor.cooldowns[actionKey] = skill.cooldown;

    if (actionKey === "basic") {
      actor.energy = Math.min(100, actor.energy + 25);
    } else {
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
        });
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

  private determineSkillTargets(
    skill: { targetType: string },
    primaryTarget: Combatant,
    allies: Combatant[],
    enemies: Combatant[]
  ): Combatant[] {
    switch (skill.targetType) {
      case "aoe_enemy":
        return enemies.filter((u) => u.alive);
      case "aoe_ally":
        return allies.filter((u) => u.alive || skill.targetType === "REVIVE");
      case "self":
        return [primaryTarget];
      case "single_ally":
      case "single_enemy":
      default:
        return primaryTarget ? [primaryTarget] : [];
    }
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
