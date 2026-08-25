import type { Combatant, StatusEffect, StatusType } from "./BattleState";

export class StatusManager {
  static applyStatus(target: Combatant, effect: Omit<StatusEffect, "id">): StatusEffect {
    const existingIndex = target.statusEffects.findIndex((s) => s.type === effect.type && s.originId === effect.originId);
    if (existingIndex >= 0) {
      const existing = target.statusEffects[existingIndex];
      existing.duration = Math.max(existing.duration, effect.duration);
      existing.stacks = Math.min(5, existing.stacks + (effect.stacks || 1));
      existing.value = Math.max(existing.value, effect.value);
      return existing;
    }
    const newEffect: StatusEffect = {
      id: `${effect.type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...effect,
      stacks: effect.stacks || 1,
    };
    target.statusEffects.push(newEffect);
    return newEffect;
  }

  static isControlStunned(combatant: Combatant): boolean {
    return combatant.statusEffects.some((s) => s.type === "stun" || s.type === "freeze");
  }

  static getEffectiveAttack(combatant: Combatant): number {
    let multiplier = 1.0;
    for (const status of combatant.statusEffects) {
      if (status.type === "attack_up") multiplier += (status.value / 100) * status.stacks;
      if (status.type === "attack_down") multiplier -= (status.value / 100) * status.stacks;
    }
    return Math.max(1, Math.floor(combatant.attack * Math.max(0.1, multiplier)));
  }

  static getEffectiveDefense(combatant: Combatant): number {
    let multiplier = 1.0;
    for (const status of combatant.statusEffects) {
      if (status.type === "defense_up") multiplier += (status.value / 100) * status.stacks;
      if (status.type === "defense_down") multiplier -= (status.value / 100) * status.stacks;
    }
    return Math.max(0, Math.floor(combatant.defense * Math.max(0.0, multiplier)));
  }

  static getEffectiveSpeed(combatant: Combatant): number {
    let multiplier = 1.0;
    for (const status of combatant.statusEffects) {
      if (status.type === "speed_up") multiplier += (status.value / 100) * status.stacks;
      if (status.type === "speed_down") multiplier -= (status.value / 100) * status.stacks;
    }
    return Math.max(1, Math.floor(combatant.speed * Math.max(0.1, multiplier)));
  }

  static getTotalShield(combatant: Combatant): number {
    return combatant.statusEffects
      .filter((s) => s.type === "shield")
      .reduce((total, s) => total + s.value, 0);
  }

  static absorbDamageWithShield(combatant: Combatant, damage: number): { remainingDamage: number; absorbed: number } {
    let remaining = damage;
    let totalAbsorbed = 0;

    const shieldEffects = combatant.statusEffects.filter((s) => s.type === "shield");
    for (const shield of shieldEffects) {
      if (remaining <= 0) break;
      if (shield.value >= remaining) {
        shield.value -= remaining;
        totalAbsorbed += remaining;
        remaining = 0;
      } else {
        remaining -= shield.value;
        totalAbsorbed += shield.value;
        shield.value = 0;
      }
    }

    combatant.statusEffects = combatant.statusEffects.filter((s) => s.type !== "shield" || s.value > 0);
    return { remainingDamage: remaining, absorbed: totalAbsorbed };
  }

  static processTurnStartDoTs(combatant: Combatant): { damage: number; log: Array<{ type: StatusType; amount: number }> } {
    let totalDamage = 0;
    const log: Array<{ type: StatusType; amount: number }> = [];

    for (const status of combatant.statusEffects) {
      if (status.type === "burn" || status.type === "poison" || status.type === "bleed") {
        const dotDamage = Math.floor(status.value * status.stacks);
        totalDamage += dotDamage;
        log.push({ type: status.type, amount: dotDamage });
      }
    }

    if (totalDamage > 0) {
      combatant.hp = Math.max(0, combatant.hp - totalDamage);
      if (combatant.hp === 0) {
        combatant.alive = false;
      }
    }

    return { damage: totalDamage, log };
  }

  static decrementDurations(combatant: Combatant): void {
    for (const status of combatant.statusEffects) {
      status.duration -= 1;
    }
    combatant.statusEffects = combatant.statusEffects.filter((s) => s.duration > 0);
  }
}
