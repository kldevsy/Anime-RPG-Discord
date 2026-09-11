import { StatusManager } from "./StatusManager";
import type { Combatant, Skill } from "./BattleState";
import { calculateDamageModifiers, applyDamageModifiers, getModifierEmoji, type ElementType, type PositionType } from "../services/FormationService";

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  absorbedByShield: number;
  critical: boolean;
  isExecute: boolean;
  formationModifier?: number;
  modifierDescription?: string[];
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

  for (const effect of skill.conditionalEffects ?? []) {
    if (effect.condition === "target_missing_hp_above" && (1 - defender.hp / defender.maxHp) >= (effect.threshold ?? 0)) {
      damageMultiplier += effect.damageMultiplierBonus ?? 0;
    }
    if (effect.condition === "critical_hit" && critical) {
      damageMultiplier += effect.damageMultiplierBonus ?? 0;
    }
  }

  const rawDamage = Math.max(1, Math.floor(base * damageMultiplier));

  // ===== FORMATION & COUNTER SYSTEM =====
  // Apply formation modifiers (element, role counter, position)
  let finalRawDamage = rawDamage;
  let formationModifier = 1.0;
  let modifierDescription: string[] = [];

  if (attacker.element && defender.element && attacker.role && defender.role && attacker.position && defender.position) {
    const modifiers = calculateDamageModifiers(
      attacker.element as ElementType,
      defender.element as ElementType,
      attacker.role as any,
      defender.role as any,
      attacker.position as PositionType,
      defender.position as PositionType
    );

    finalRawDamage = applyDamageModifiers(rawDamage, modifiers);
    formationModifier = modifiers.total;
    modifierDescription = modifiers.description;
  }

  const { remainingDamage, absorbed } = StatusManager.absorbDamageWithShield(defender, finalRawDamage);

  return {
    rawDamage: finalRawDamage,
    finalDamage: remainingDamage,
    absorbedByShield: absorbed,
    critical,
    isExecute,
    formationModifier,
    modifierDescription,
  };
}
