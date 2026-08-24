import type { Combatant } from "./BattleState";

export type AIAction = "basic_attack" | "ultimate" | "heal";

export function chooseAction(actor: Combatant, allies: Combatant[], enemies: Combatant[]): AIAction {
  const lowestAlly = allies.filter((unit) => unit.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (actor.role === "healer" && lowestAlly && lowestAlly.hp / lowestAlly.maxHp < 0.55) return "heal";
  if (actor.energy >= 100) return "ultimate";
  return "basic_attack";
}