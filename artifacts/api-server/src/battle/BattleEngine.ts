import { randomInt } from "node:crypto";
import { chooseAction } from "./AIController";
import { calculateDamage } from "./DamageCalculator";
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
      playerTeam: structuredClone(this.playerTeam),
      enemyTeam: structuredClone(this.enemyTeam),
      actions: structuredClone(this.actions),
    };
  }

  run(maxRounds = 100): BattleSnapshot {
    for (let step = 0; step < maxRounds * 20 && !this.isFinished(); step += 1) this.step();
    if (this.isFinished()) this.phase = this.resultPhase();
    else this.phase = "DRAW";
    return this.snapshot();
  }

  step(): BattleSnapshot {
    if (this.isFinished()) return this.snapshot();
    switch (this.phase) {
      case "WAITING": this.phase = "PREPARING"; break;
      case "PREPARING": this.phase = "INITIATIVE"; break;
      case "INITIATIVE":
        this.initiative = [...this.playerTeam, ...this.enemyTeam].filter((unit) => unit.alive).sort((a, b) => b.speed - a.speed || randomInt(0, 2) - 0.5);
        this.phase = "ROUND_START";
        break;
      case "ROUND_START": this.round += 1; this.turn = 0; this.phase = "CHARACTER_TURN"; break;
      case "CHARACTER_TURN":
        if (this.turn >= this.initiative.length) this.phase = "ROUND_END";
        else this.phase = "ACTION";
        break;
      case "ACTION": this.performTurn(); this.phase = "DAMAGE"; break;
      case "DAMAGE": this.phase = "STATUS_PROCESS"; break;
      case "STATUS_PROCESS": this.phase = "DEATH_CHECK"; break;
      case "DEATH_CHECK": this.checkDeaths(); this.phase = "NEXT_TURN"; break;
      case "NEXT_TURN": this.turn += 1; this.phase = "CHARACTER_TURN"; break;
      case "ROUND_END": this.phase = this.isFinished() ? this.resultPhase() : "INITIATIVE"; break;
      default: break;
    }
    return this.snapshot();
  }

  private performTurn() {
    const actor = this.initiative[this.turn];
    if (!actor?.alive) return;
    const allies = this.teamOf(actor);
    const enemies = allies === this.playerTeam ? this.enemyTeam : this.playerTeam;
    const action = chooseAction(actor, allies, enemies);
    if (action === "heal") {
      const target = allies.filter((unit) => unit.alive).sort((a, b) => a.hp - b.hp)[0] ?? actor;
      const amount = Math.min(target.maxHp - target.hp, Math.floor(actor.attack * 0.8));
      target.hp += amount;
      actor.energy = 0;
      this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: "heal", targetId: target.id, targetName: target.name, amount });
      return;
    }
    const target = enemies.filter((unit) => unit.alive).sort((a, b) => a.hp - b.hp)[0];
    if (!target) return;
    const critical = action === "ultimate" ? 0 : randomInt(0, 100);
    const damage = calculateDamage(actor, target, critical);
    const multiplier = action === "ultimate" ? 2 : 1;
    const amount = Math.min(target.hp, damage.amount * multiplier);
    target.hp -= amount;
    actor.energy = action === "ultimate" ? 0 : Math.min(100, actor.energy + 25);
    this.actions.push({ round: this.round, actorId: actor.id, actorName: actor.name, type: action, targetId: target.id, targetName: target.name, amount, critical: damage.critical });
  }

  private teamOf(actor: Combatant) { return this.playerTeam.includes(actor) ? this.playerTeam : this.enemyTeam; }
  private checkDeaths() {
    for (const unit of [...this.playerTeam, ...this.enemyTeam]) {
      if (unit.alive && unit.hp <= 0) {
        unit.hp = 0; unit.alive = false;
        this.actions.push({ round: this.round, actorId: "system", actorName: "Sistema", type: "defeat", targetId: unit.id, targetName: unit.name });
      }
    }
  }
  private isFinished() { return !this.playerTeam.some((unit) => unit.alive) || !this.enemyTeam.some((unit) => unit.alive); }
  private resultPhase(): BattlePhase {
    if (this.playerTeam.some((unit) => unit.alive)) return "VICTORY";
    if (this.enemyTeam.some((unit) => unit.alive)) return "DEFEAT";
    return "DRAW";
  }
}