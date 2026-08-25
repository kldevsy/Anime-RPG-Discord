import type { Combatant, CombatantRole, Skill } from "./BattleState";

export class SkillManager {
  static createDefaultSkills(role: CombatantRole, name: string): Combatant["skills"] {
    const basic: Skill = {
      id: "basic_attack",
      name: "Ataque Básico",
      type: "DAMAGE",
      energyCost: 0,
      cooldown: 0,
      targetType: "single_enemy",
      multiplier: 1.0,
    };

    switch (role) {
      case "tank":
        return {
          basic,
          skill1: {
            id: "tank_skill1",
            name: "Provocar e Escudo",
            type: "SHIELD",
            energyCost: 20,
            cooldown: 2,
            targetType: "self",
            multiplier: 0.8,
            statusEffects: [{ type: "shield", chance: 100, duration: 2, value: 150 }],
          },
          skill2: {
            id: "tank_skill2",
            name: "Golpe Defensivo",
            type: "STUN",
            energyCost: 35,
            cooldown: 3,
            targetType: "single_enemy",
            multiplier: 1.2,
            statusEffects: [{ type: "stun", chance: 60, duration: 1, value: 0 }],
          },
          ultimate: {
            id: "tank_ult",
            name: "Muralha Inabalável",
            type: "SHIELD",
            energyCost: 100,
            cooldown: 4,
            targetType: "aoe_ally",
            multiplier: 0,
            statusEffects: [
              { type: "shield", chance: 100, duration: 3, value: 300 },
              { type: "defense_up", chance: 100, duration: 2, value: 30 },
            ],
          },
        };
      case "healer":
        return {
          basic,
          skill1: {
            id: "heal_skill1",
            name: "Cura Rápida",
            type: "HEAL",
            energyCost: 25,
            cooldown: 2,
            targetType: "single_ally",
            multiplier: 1.5,
          },
          skill2: {
            id: "heal_skill2",
            name: "Bênção Purificadora",
            type: "BUFF",
            energyCost: 40,
            cooldown: 3,
            targetType: "aoe_ally",
            multiplier: 0.8,
            statusEffects: [{ type: "attack_up", chance: 100, duration: 2, value: 20 }],
          },
          ultimate: {
            id: "heal_ult",
            name: "Milagre Divino",
            type: "REVIVE",
            energyCost: 100,
            cooldown: 5,
            targetType: "aoe_ally",
            multiplier: 2.5,
          },
        };
      case "support":
        return {
          basic,
          skill1: {
            id: "sup_skill1",
            name: "Estimulo Tático",
            type: "BUFF",
            energyCost: 25,
            cooldown: 2,
            targetType: "aoe_ally",
            multiplier: 0,
            statusEffects: [
              { type: "attack_up", chance: 100, duration: 2, value: 25 },
              { type: "speed_up", chance: 100, duration: 2, value: 20 },
            ],
          },
          skill2: {
            id: "sup_skill2",
            name: "Debilitador",
            type: "DEBUFF",
            energyCost: 35,
            cooldown: 3,
            targetType: "single_enemy",
            multiplier: 1.1,
            statusEffects: [
              { type: "defense_down", chance: 100, duration: 2, value: 30 },
              { type: "attack_down", chance: 100, duration: 2, value: 20 },
            ],
          },
          ultimate: {
            id: "sup_ult",
            name: "Domínio Absoluto",
            type: "BUFF",
            energyCost: 100,
            cooldown: 4,
            targetType: "aoe_ally",
            multiplier: 0,
            statusEffects: [
              { type: "attack_up", chance: 100, duration: 3, value: 40 },
              { type: "speed_up", chance: 100, duration: 3, value: 30 },
            ],
          },
        };
      case "control":
        return {
          basic,
          skill1: {
            id: "ctrl_skill1",
            name: "Congelar",
            type: "STUN",
            energyCost: 30,
            cooldown: 2,
            targetType: "single_enemy",
            multiplier: 1.0,
            statusEffects: [{ type: "freeze", chance: 75, duration: 1, value: 0 }],
          },
          skill2: {
            id: "ctrl_skill2",
            name: "Venenos e Chamas",
            type: "DOT",
            energyCost: 40,
            cooldown: 3,
            targetType: "aoe_enemy",
            multiplier: 0.8,
            statusEffects: [
              { type: "poison", chance: 100, duration: 3, value: 40 },
              { type: "burn", chance: 80, duration: 2, value: 50 },
            ],
          },
          ultimate: {
            id: "ctrl_ult",
            name: "Tormenta Elemental",
            type: "AOE",
            energyCost: 100,
            cooldown: 4,
            targetType: "aoe_enemy",
            multiplier: 2.0,
            statusEffects: [
              { type: "stun", chance: 50, duration: 1, value: 0 },
              { type: "speed_down", chance: 100, duration: 2, value: 25 },
            ],
          },
        };
      case "dps":
      default:
        return {
          basic,
          skill1: {
            id: "dps_skill1",
            name: "Corte Preciso",
            type: "DAMAGE",
            energyCost: 25,
            cooldown: 2,
            targetType: "single_enemy",
            multiplier: 1.6,
            statusEffects: [{ type: "bleed", chance: 60, duration: 2, value: 45 }],
          },
          skill2: {
            id: "dps_skill2",
            name: "Explosão Devastadora",
            type: "AOE",
            energyCost: 40,
            cooldown: 3,
            targetType: "aoe_enemy",
            multiplier: 1.3,
            statusEffects: [{ type: "burn", chance: 70, duration: 2, value: 40 }],
          },
          ultimate: {
            id: "dps_ult",
            name: "Ataque Aniquilador",
            type: "EXECUTE",
            energyCost: 100,
            cooldown: 4,
            targetType: "single_enemy",
            multiplier: 2.8,
          },
        };
    }
  }

  static createCombatant(partial: Partial<Combatant> & { id: string; name: string; role: CombatantRole }): Combatant {
    const maxHp = partial.maxHp ?? 500;
    const skills = partial.skills ?? SkillManager.createDefaultSkills(partial.role, partial.name);

    return {
      id: partial.id,
      name: partial.name,
      role: partial.role,
      maxHp,
      hp: partial.hp ?? maxHp,
      attack: partial.attack ?? 100,
      defense: partial.defense ?? 50,
      speed: partial.speed ?? 100,
      critChance: partial.critChance ?? 15,
      critDamage: partial.critDamage ?? 1.5,
      energy: partial.energy ?? 0,
      alive: partial.alive ?? true,
      statusEffects: partial.statusEffects ?? [],
      cooldowns: partial.cooldowns ?? {},
      skills,
      passive: partial.passive,
    };
  }
}
