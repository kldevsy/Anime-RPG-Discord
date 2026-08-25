import { StatusManager } from "./StatusManager";
import type { Combatant, Skill } from "./BattleState";

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  absorbedByShield: number;
  critical: boolean;
  isExecute: boolean;
}

export function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  skill: Skill,
  roll: number
): DamageResult {
  const effectiveAttack = StatusManager.getEffectiveAttack(attacker);
  const effectiveDefense = StatusManager.getEffectiveDefense(defender);

  const base = Math.max(1, Math.floor(effectiveAttack * skill.multiplier - effectiveDefense * 0.5));
  const critical = roll < attacker.critChance;

  let damageMultiplier = critical ? attacker.critDamage : 1.0;

  let isExecute = false;
  if (skill.type === "EXECUTE") {
    const missingHpRatio = 1 - defender.hp / defender.maxHp;
    if (missingHpRatio > 0.5) {
      damageMultiplier += missingHpRatio * 1.5;
      isExecute = true;
    }
  }

  const rawDamage = Math.max(1, Math.floor(base * damageMultiplier));

  const { remainingDamage, absorbed } = StatusManager.absorbDamageWithShield(defender, rawDamage);

  return {
    rawDamage,
    finalDamage: remainingDamage,
    absorbedByShield: absorbed,
    critical,
    isExecute,
  };
}
