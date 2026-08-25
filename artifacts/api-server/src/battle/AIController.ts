import { StatusManager } from "./StatusManager";
import type { Combatant, Skill } from "./BattleState";

export type AIActionSelection = {
  skill: Skill;
  actionKey: "basic" | "skill1" | "skill2" | "ultimate";
  target: Combatant;
};

export function chooseAction(actor: Combatant, allies: Combatant[], enemies: Combatant[]): AIActionSelection | null {
  if (!actor.alive || StatusManager.isControlStunned(actor)) {
    return null;
  }

  const aliveAllies = allies.filter((unit) => unit.alive);
  const aliveEnemies = enemies.filter((unit) => unit.alive);

  if (aliveEnemies.length === 0) {
    return null;
  }

  const lowestHpAlly = [...aliveAllies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const lowestHpEnemy = [...aliveEnemies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const highestAttackEnemy = [...aliveEnemies].sort((a, b) => StatusManager.getEffectiveAttack(b) - StatusManager.getEffectiveAttack(a))[0];

  const canUse = (skill: Skill, key: "basic" | "skill1" | "skill2" | "ultimate"): boolean => {
    if (key === "ultimate") return actor.ultimateReady && (actor.cooldowns[key] ?? 0) <= 0;
    if (actor.energy < skill.energyCost) return false;
    const cd = actor.cooldowns[key] ?? 0;
    return cd <= 0;
  };

  // Rule 1: A ready ultimate is only prioritized when its target would benefit.
  if (canUse(actor.skills.ultimate, "ultimate")) {
    const ult = actor.skills.ultimate;
    let target = lowestHpEnemy;
    let advantageous = aliveEnemies.length > 0;
    if (ult.targetType === "aoe_ally" || ult.targetType === "single_ally" || ult.type === "HEAL" || ult.type === "REVIVE" || ult.type === "SHIELD") {
      target = lowestHpAlly || actor;
      advantageous = ult.type === "REVIVE"
        ? allies.some((unit) => !unit.alive)
        : ult.type === "HEAL" || ult.type === "SHIELD"
          ? aliveAllies.some((unit) => unit.hp < unit.maxHp)
          : aliveAllies.length > 0;
    } else if (ult.type === "EXECUTE" || ult.type === "DAMAGE") {
      target = lowestHpEnemy;
    }
    if (advantageous && target) return { skill: ult, actionKey: "ultimate", target };
  }

  // Rule 2: Ally low HP (< 40%) -> prioritize Heal / Shield / Defensive skill
  if (lowestHpAlly && lowestHpAlly.hp / lowestHpAlly.maxHp < 0.40) {
    if (canUse(actor.skills.skill1, "skill1") && (actor.skills.skill1.type === "HEAL" || actor.skills.skill1.type === "SHIELD")) {
      return { skill: actor.skills.skill1, actionKey: "skill1", target: lowestHpAlly };
    }
    if (canUse(actor.skills.skill2, "skill2") && (actor.skills.skill2.type === "HEAL" || actor.skills.skill2.type === "SHIELD")) {
      return { skill: actor.skills.skill2, actionKey: "skill2", target: lowestHpAlly };
    }
  }

  // Rule 3: Enemy low HP (< 20%) -> prioritize high-damage or execute skills
  if (lowestHpEnemy && lowestHpEnemy.hp / lowestHpEnemy.maxHp < 0.20) {
    if (canUse(actor.skills.skill2, "skill2") && (actor.skills.skill2.type === "EXECUTE" || actor.skills.skill2.type === "DAMAGE")) {
      return { skill: actor.skills.skill2, actionKey: "skill2", target: lowestHpEnemy };
    }
    if (canUse(actor.skills.skill1, "skill1") && (actor.skills.skill1.type === "EXECUTE" || actor.skills.skill1.type === "DAMAGE")) {
      return { skill: actor.skills.skill1, actionKey: "skill1", target: lowestHpEnemy };
    }
  }

  // Rule 4: Try skill2 if available
  if (canUse(actor.skills.skill2, "skill2")) {
    const skill = actor.skills.skill2;
    const target = (skill.targetType.includes("ally") || skill.type === "HEAL" || skill.type === "SHIELD" || skill.type === "BUFF")
      ? lowestHpAlly
      : (skill.type === "STUN" || skill.type === "DEBUFF" ? highestAttackEnemy : lowestHpEnemy);
    return { skill, actionKey: "skill2", target: target || lowestHpEnemy };
  }

  // Rule 5: Try skill1 if available
  if (canUse(actor.skills.skill1, "skill1")) {
    const skill = actor.skills.skill1;
    const target = (skill.targetType.includes("ally") || skill.type === "HEAL" || skill.type === "SHIELD" || skill.type === "BUFF")
      ? lowestHpAlly
      : (skill.type === "STUN" || skill.type === "DEBUFF" ? highestAttackEnemy : lowestHpEnemy);
    return { skill, actionKey: "skill1", target: target || lowestHpEnemy };
  }

  // Default: Basic Attack
  return {
    skill: actor.skills.basic,
    actionKey: "basic",
    target: lowestHpEnemy,
  };
}
