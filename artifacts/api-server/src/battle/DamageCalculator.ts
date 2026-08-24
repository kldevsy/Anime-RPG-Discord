import type { Combatant } from "./BattleState";

export interface DamageResult {
  amount: number;
  critical: boolean;
}

export function calculateDamage(attacker: Combatant, defender: Combatant, roll: number): DamageResult {
  const base = Math.max(1, attacker.attack - Math.floor(defender.defense * 0.55));
  const critical = roll < attacker.critChance;
  return {
    amount: Math.max(1, Math.floor(base * (critical ? attacker.critDamage : 1))),
    critical,
  };
}