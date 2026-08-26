/**
 * PassiveManager - Sistema de execução de passivas durante batalhas
 * 
 * Processa triggers, avalia condições e aplica efeitos de passivas
 * automaticamente durante o combate.
 */

import { randomInt } from "node:crypto";
import type { Combatant, StatusType, BattleAction } from "./BattleState";
import type {
  PassiveAbility,
  PassiveCondition,
  PassiveEffect,
  PassiveContext,
  PassiveExecutionResult,
  PassiveActivationState,
  PassiveTrigger,
} from "./PassiveTypes";
import { StatusManager } from "./StatusManager";

export class PassiveManager {
  private activationStates = new Map<string, PassiveActivationState>();

  constructor(private round: number = 0) {}

  /**
   * Atualiza rodada atual
   */
  setRound(round: number): void {
    this.round = round;
    // Decrementa cooldowns no início de cada rodada
    for (const state of this.activationStates.values()) {
      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining--;
      }
      state.activationsThisRound = 0;
    }
  }

  /**
   * Processa passivas para um trigger específico
   */
  processTrigger(
    context: PassiveContext,
    actions: BattleAction[]
  ): PassiveExecutionResult[] {
    const results: PassiveExecutionResult[] = [];

    if (!context.owner.alive) return results;
    
    const passives = this.getPassivesForCombatant(context.owner);
    
    // Ordena por prioridade (maior primeiro)
    const sorted = passives.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const passive of sorted) {
      if (passive.trigger !== context.trigger && passive.trigger !== "always") {
        continue;
      }

      // Verifica limites de ativação e cooldown
      if (!this.canActivate(passive, context.owner)) {
        continue;
      }

      // Avalia condições
      if (!this.evaluateConditions(passive, context)) {
        continue;
      }

      // Executa efeitos
      const result = this.executePassive(passive, context, actions);
      
      if (result.activated) {
        results.push(result);
        this.recordActivation(passive, context.owner);
      }
    }

    return results;
  }

  /**
   * Obtém passivas de um combatente
   */
  private getPassivesForCombatant(combatant: Combatant): PassiveAbility[] {
    // Por enquanto, suporta uma passiva por personagem
    // Futuro: suportar múltiplas passivas (equipamentos, buffs temporários, etc)
    const passives: PassiveAbility[] = [];
    
    if (combatant.passiveAbility) {
      passives.push(combatant.passiveAbility);
    }
    
    return passives;
  }

  /**
   * Verifica se passiva pode ser ativada (cooldown e limites)
   */
  private canActivate(passive: PassiveAbility, owner: Combatant): boolean {
    const key = `${owner.id}-${passive.id}`;
    const state = this.getOrCreateState(key, passive.id);

    // Verifica cooldown
    if (state.cooldownRemaining > 0) {
      return false;
    }

    // Verifica limite por batalha
    if (passive.maxActivationsPerBattle !== undefined) {
      if (state.activationsThisBattle >= passive.maxActivationsPerBattle) {
        return false;
      }
    }

    // Verifica limite por rodada
    if (passive.maxActivationsPerRound !== undefined) {
      if (state.activationsThisRound >= passive.maxActivationsPerRound) {
        return false;
      }
    }

    return true;
  }

  /**
   * Avalia todas as condições de uma passiva
   */
  private evaluateConditions(passive: PassiveAbility, context: PassiveContext): boolean {
    if (!passive.conditions || passive.conditions.length === 0) {
      return true;
    }

    // Todas as condições devem ser verdadeiras (AND lógico)
    return passive.conditions.every(condition => 
      this.evaluateCondition(condition, context)
    );
  }

  /**
   * Avalia uma condição individual
   */
  private evaluateCondition(condition: PassiveCondition, context: PassiveContext): boolean {
    const { owner, target, damage, isCritical, allies, enemies } = context;

    switch (condition.type) {
      // Condições de HP do owner
      case "hp_below_percent":
        return (owner.hp / owner.maxHp) * 100 < (condition.value ?? 0);
      
      case "hp_above_percent":
        return (owner.hp / owner.maxHp) * 100 > (condition.value ?? 0);
      
      case "hp_equals_percent":
        return Math.abs((owner.hp / owner.maxHp) * 100 - (condition.value ?? 0)) < 1;

      // Condições de HP do target
      case "target_hp_below_percent":
        return target ? (target.hp / target.maxHp) * 100 < (condition.value ?? 0) : false;
      
      case "target_hp_above_percent":
        return target ? (target.hp / target.maxHp) * 100 > (condition.value ?? 0) : false;

      // Condições de status do target
      case "target_has_status":
        return target ? target.statusEffects.some(s => s.type === condition.statusType) : false;
      
      case "target_is_role":
        return target ? target.role === condition.role : false;

      // Condições de status do owner
      case "has_status":
        return owner.statusEffects.some(s => s.type === condition.statusType);
      
      case "has_buff":
        return owner.statusEffects.some(s => 
          s.type === "attack_up" || s.type === "defense_up" || s.type === "speed_up" || s.type === "shield"
        );
      
      case "has_debuff":
        return owner.statusEffects.some(s => 
          s.type === "attack_down" || s.type === "defense_down" || s.type === "speed_down" ||
          s.type === "burn" || s.type === "poison" || s.type === "bleed" || s.type === "freeze" || s.type === "stun"
        );
      
      case "status_count_above":
        return owner.statusEffects.length > (condition.value ?? 0);

      // Condições de combate
      case "is_critical":
        return isCritical === true;
      
      case "damage_above":
        return damage !== undefined && damage > (condition.value ?? 0);
      
      case "damage_below":
        return damage !== undefined && damage < (condition.value ?? 0);
      
      case "first_hit":
        return context.round === 1;

      // Condições de equipe
      case "allies_alive_below":
        return allies.filter(a => a.alive).length < (condition.value ?? 0);
      
      case "allies_alive_above":
        return allies.filter(a => a.alive).length > (condition.value ?? 0);
      
      case "enemies_alive_below":
        return enemies.filter(e => e.alive).length < (condition.value ?? 0);
      
      case "enemies_alive_above":
        return enemies.filter(e => e.alive).length > (condition.value ?? 0);
      
      case "is_last_standing":
        return allies.filter(a => a.alive).length === 1 && allies.some(a => a.id === owner.id && a.alive);

      // Condições de rodada
      case "round_above":
        return context.round > (condition.value ?? 0);
      
      case "round_below":
        return context.round < (condition.value ?? 0);
      
      case "is_first_round":
        return context.round === 1;

      // Condições de chance
      case "random_chance":
        return randomInt(0, 100) < (condition.value ?? 0);

      // Condições de role
      case "is_role":
        return owner.role === condition.role;

      default:
        return true;
    }
  }

  /**
   * Executa os efeitos de uma passiva
   */
  private executePassive(
    passive: PassiveAbility,
    context: PassiveContext,
    actions: BattleAction[]
  ): PassiveExecutionResult {
    const result: PassiveExecutionResult = {
      activated: true,
      passiveName: passive.name,
      effects: [],
    };

    for (const effect of passive.effects) {
      // Verifica chance de aplicar
      if (effect.chance !== undefined && randomInt(0, 100) >= effect.chance) {
        continue;
      }

      const targets = this.determineTargets(effect, context);
      
      for (const target of targets) {
        if (!target.alive && effect.type !== "revive_self") continue;
        
        const effectResult = this.applyEffect(effect, target, context, actions);
        result.effects.push(effectResult);
      }
    }

    return result;
  }

  /**
   * Determina alvos para um efeito
   */
  private determineTargets(effect: PassiveEffect, context: PassiveContext): Combatant[] {
    const { owner, target, allies, enemies } = context;
    
    switch (effect.target) {
      case "self":
        return [owner];
      
      case "attacker":
        return context.actor ? [context.actor] : [];
      
      case "target":
        return target ? [target] : [];
      
      case "allies":
        return allies.filter(a => a.alive);
      
      case "enemies":
        return enemies.filter(e => e.alive);
      
      case "all":
        return [...allies, ...enemies].filter(c => c.alive);
      
      case "random_enemy":
        const aliveEnemies = enemies.filter(e => e.alive);
        return aliveEnemies.length > 0 ? [aliveEnemies[randomInt(0, aliveEnemies.length)]] : [];
      
      case "random_ally":
        const aliveAllies = allies.filter(a => a.alive);
        return aliveAllies.length > 0 ? [aliveAllies[randomInt(0, aliveAllies.length)]] : [];
      
      case "lowest_hp_ally":
        const sortedAllies = allies.filter(a => a.alive).sort((a, b) => a.hp - b.hp);
        return sortedAllies.length > 0 ? [sortedAllies[0]] : [];
      
      case "lowest_hp_enemy":
        const sortedEnemies = enemies.filter(e => e.alive).sort((a, b) => a.hp - b.hp);
        return sortedEnemies.length > 0 ? [sortedEnemies[0]] : [];
      
      default:
        return [owner];
    }
  }

  /**
   * Aplica um efeito específico em um alvo
   */
  private applyEffect(
    effect: PassiveEffect,
    target: Combatant,
    context: PassiveContext,
    actions: BattleAction[]
  ): { type: string; target: string; value: number; success: boolean } {
    const owner = context.owner;
    let success = true;
    let value = effect.value;

    switch (effect.type) {
      // Efeitos de stats (permanentes durante a batalha)
      case "increase_attack":
        target.attack += value;
        break;
      
      case "increase_defense":
        target.defense += value;
        break;
      
      case "increase_speed":
        target.speed += value;
        break;
      
      case "increase_hp":
        target.maxHp += value;
        target.hp += value;
        break;
      
      case "increase_crit_chance":
        target.critChance += value;
        break;
      
      case "increase_crit_damage":
        target.critDamage += value;
        break;

      // Efeitos de dano
      case "bonus_damage":
        if (context.modifiedDamage !== undefined) {
          context.modifiedDamage += value;
        }
        break;
      
      case "bonus_damage_percent":
        if (context.modifiedDamage !== undefined) {
          context.modifiedDamage = Math.floor(context.modifiedDamage * (1 + value / 100));
        }
        break;
      
      case "reflect_damage":
        if (context.damage && context.actor) {
          const reflectDamage = Math.floor(context.damage * (value / 100));
          context.actor.hp = Math.max(0, context.actor.hp - reflectDamage);
          actions.push({
            round: context.round,
            actorId: owner.id,
            actorName: owner.name,
            type: "basic_attack",
            targetId: context.actor.id,
            targetName: context.actor.name,
            amount: reflectDamage,
            skillName: "Reflexo",
          });
          value = reflectDamage;
        }
        break;
      
      case "lifesteal":
        if (context.damage) {
          const healAmount = Math.floor(context.damage * (value / 100));
          const actualHeal = Math.min(owner.maxHp - owner.hp, healAmount);
          owner.hp += actualHeal;
          value = actualHeal;
        }
        break;

      // Efeitos de cura
      case "heal_self":
        const healAmount = Math.min(target.maxHp - target.hp, value);
        target.hp += healAmount;
        actions.push({
          round: context.round,
          actorId: owner.id,
          actorName: owner.name,
          type: "heal",
          targetId: target.id,
          targetName: target.name,
          amount: healAmount,
          skillName: "Passiva",
        });
        value = healAmount;
        break;
      
      case "heal_percent":
        const percentHeal = Math.floor(target.maxHp * (value / 100));
        const actualPercentHeal = Math.min(target.maxHp - target.hp, percentHeal);
        target.hp += actualPercentHeal;
        value = actualPercentHeal;
        break;
      
      case "regeneration":
        StatusManager.applyStatus(target, {
          type: "shield",
          duration: effect.duration ?? 3,
          stacks: 1,
          value: value,
          originId: owner.id,
        });
        break;

      // Efeitos de status
      case "apply_status":
        if (effect.statusType) {
          StatusManager.applyStatus(target, {
            type: effect.statusType as StatusType,
            duration: effect.duration ?? 2,
            stacks: 1,
            value: value,
            originId: owner.id,
          });
          actions.push({
            round: context.round,
            actorId: owner.id,
            actorName: owner.name,
            type: "status_applied",
            targetId: target.id,
            targetName: target.name,
            statusType: effect.statusType as StatusType,
          });
        }
        break;
      
      case "cleanse_debuff":
        const debuffs = target.statusEffects.filter(s =>
          s.type === "attack_down" || s.type === "defense_down" || s.type === "speed_down" ||
          s.type === "burn" || s.type === "poison" || s.type === "bleed" || s.type === "stun" || s.type === "freeze"
        );
        const toRemove = debuffs.slice(0, value);
        for (const debuff of toRemove) {
          target.statusEffects = target.statusEffects.filter(s => s.id !== debuff.id);
        }
        value = toRemove.length;
        break;

      // Efeitos de proteção
      case "damage_reduction":
        if (context.modifiedDamage !== undefined) {
          const reduction = Math.floor(context.modifiedDamage * (value / 100));
          context.modifiedDamage = Math.max(0, context.modifiedDamage - reduction);
          value = reduction;
        }
        break;
      
      case "shield":
        StatusManager.applyStatus(target, {
          type: "shield",
          duration: effect.duration ?? 2,
          stacks: 1,
          value: value,
          originId: owner.id,
        });
        break;
      
      case "prevent_death":
        if (target.hp <= 0) {
          target.hp = Math.floor(target.maxHp * (value / 100));
          context.preventAction = true;
          value = target.hp;
        } else {
          success = false;
        }
        break;

      // Efeitos de energia/carga
      case "gain_energy":
        target.energy = Math.min(target.maxEnergy, target.energy + value);
        break;
      
      case "gain_ultimate_charge":
        target.ultimateCharge = Math.min(target.ultimateChargeRequired, target.ultimateCharge + value);
        if (target.ultimateCharge >= target.ultimateChargeRequired) {
          target.ultimateReady = true;
        }
        break;
      
      case "reduce_cooldown":
        for (const key of Object.keys(target.cooldowns)) {
          target.cooldowns[key] = Math.max(0, target.cooldowns[key] - value);
        }
        break;

      // Efeitos de controle
      case "stun_attacker":
        if (context.actor && effect.statusType) {
          StatusManager.applyStatus(context.actor, {
            type: "stun",
            duration: effect.duration ?? 1,
            stacks: 1,
            value: 0,
            originId: owner.id,
          });
        }
        break;
      
      case "counter_attack":
        if (context.actor && context.damage) {
          const counterDamage = Math.floor(owner.attack * (value / 100));
          context.actor.hp = Math.max(0, context.actor.hp - counterDamage);
          actions.push({
            round: context.round,
            actorId: owner.id,
            actorName: owner.name,
            type: "basic_attack",
            targetId: context.actor.id,
            targetName: context.actor.name,
            amount: counterDamage,
            skillName: "Contra-ataque",
          });
          value = counterDamage;
        }
        break;

      // Efeitos especiais
      case "execute_low_hp":
        if (target.hp / target.maxHp <= (value / 100)) {
          target.hp = 0;
          value = target.maxHp;
        } else {
          success = false;
        }
        break;
      
      case "dispel_buffs":
        const buffs = target.statusEffects.filter(s =>
          s.type === "attack_up" || s.type === "defense_up" || s.type === "speed_up" || s.type === "shield"
        );
        const toDispel = buffs.slice(0, value);
        for (const buff of toDispel) {
          target.statusEffects = target.statusEffects.filter(s => s.id !== buff.id);
        }
        value = toDispel.length;
        break;

      default:
        success = false;
    }

    return {
      type: effect.type,
      target: target.name,
      value,
      success,
    };
  }

  /**
   * Registra ativação de passiva
   */
  private recordActivation(passive: PassiveAbility, owner: Combatant): void {
    const key = `${owner.id}-${passive.id}`;
    const state = this.getOrCreateState(key, passive.id);
    
    state.activationsThisBattle++;
    state.activationsThisRound++;
    state.lastActivatedRound = this.round;
    
    if (passive.cooldownRounds !== undefined) {
      state.cooldownRemaining = passive.cooldownRounds;
    }
  }

  /**
   * Obtém ou cria estado de ativação
   */
  private getOrCreateState(key: string, passiveId: string): PassiveActivationState {
    if (!this.activationStates.has(key)) {
      this.activationStates.set(key, {
        passiveId,
        activationsThisBattle: 0,
        activationsThisRound: 0,
        lastActivatedRound: 0,
        cooldownRemaining: 0,
      });
    }
    return this.activationStates.get(key)!;
  }

  /**
   * Reseta estados (para nova batalha)
   */
  reset(): void {
    this.activationStates.clear();
    this.round = 0;
  }
}
