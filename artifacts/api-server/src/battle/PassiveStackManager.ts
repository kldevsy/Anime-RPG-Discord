/**
 * ========================================
 * PASSIVE STACK MANAGER
 * ========================================
 * Gerencia stacks, cooldowns e efeitos condicionais de passivas avançadas
 */

import type { Combatant, PassiveStackState } from "./BattleState";
import type { PassiveAbility } from "./PassiveTypes";

/**
 * Inicializa o tracking de stacks para um combatente
 */
export function initializePassiveStacks(combatant: Combatant): void {
  if (!combatant.passiveAbility) return;
  
  combatant.passiveStacks = new Map();
  
  const passive = combatant.passiveAbility;
  
  // Se tem stackCounter ou stackLimit, inicializa
  if (passive.stackCounter || passive.stackLimit) {
    const state: PassiveStackState = {
      passiveId: passive.id,
      currentStacks: 0,
      maxStacks: passive.stackLimit,
      cooldownRemaining: 0,
      activationsThisBattle: 0,
      activationsThisRound: 0,
    };
    
    combatant.passiveStacks.set(passive.id, state);
  }
}

/**
 * Incrementa o stack counter de uma passiva
 * Retorna true se atingiu o limite e deve disparar o stackEffect
 */
export function incrementPassiveStack(
  combatant: Combatant,
  passiveId: string
): boolean {
  if (!combatant.passiveStacks) return false;
  
  const stackState = combatant.passiveStacks.get(passiveId);
  if (!stackState) return false;
  
  const passive = combatant.passiveAbility;
  if (!passive || !passive.stackCounter) return false;
  
  // Incrementa o contador
  stackState.currentStacks++;
  
  // Se atingiu o limite, dispara o efeito e reseta
  if (stackState.currentStacks >= passive.stackCounter) {
    stackState.currentStacks = 0;
    return true;
  }
  
  return false;
}

/**
 * Adiciona stacks de resistência/buff progressivo
 * Respeita o stackLimit
 */
export function addProgressiveStack(
  combatant: Combatant,
  passiveId: string
): number {
  if (!combatant.passiveStacks) return 0;
  
  const stackState = combatant.passiveStacks.get(passiveId);
  if (!stackState) return 0;
  
  // Se tem limite e já atingiu, não adiciona mais
  if (stackState.maxStacks && stackState.currentStacks >= stackState.maxStacks) {
    return stackState.currentStacks;
  }
  
  stackState.currentStacks++;
  return stackState.currentStacks;
}

/**
 * Obtém o número atual de stacks
 */
export function getCurrentStacks(
  combatant: Combatant,
  passiveId: string
): number {
  if (!combatant.passiveStacks) return 0;
  
  const stackState = combatant.passiveStacks.get(passiveId);
  return stackState?.currentStacks ?? 0;
}

/**
 * Verifica se a passiva está em cooldown
 */
export function isPassiveOnCooldown(
  combatant: Combatant,
  passiveId: string
): boolean {
  if (!combatant.passiveStacks) return false;
  
  const stackState = combatant.passiveStacks.get(passiveId);
  if (!stackState) return false;
  
  return stackState.cooldownRemaining > 0;
}

/**
 * Inicia cooldown de uma passiva
 */
export function startPassiveCooldown(
  combatant: Combatant,
  passiveId: string,
  rounds: number
): void {
  if (!combatant.passiveStacks) return;
  
  const stackState = combatant.passiveStacks.get(passiveId);
  if (!stackState) return;
  
  stackState.cooldownRemaining = rounds;
}

/**
 * Decrementa cooldowns no início da rodada
 */
export function decrementPassiveCooldowns(combatant: Combatant): void {
  if (!combatant.passiveStacks) return;
  
  for (const [_, state] of combatant.passiveStacks) {
    if (state.cooldownRemaining > 0) {
      state.cooldownRemaining--;
    }
  }
}

/**
 * Reseta contadores de ativação por rodada
 */
export function resetRoundActivations(combatant: Combatant): void {
  if (!combatant.passiveStacks) return;
  
  for (const [_, state] of combatant.passiveStacks) {
    state.activationsThisRound = 0;
  }
}

/**
 * Verifica se pode ativar uma passiva baseado em limites
 */
export function canActivatePassive(
  combatant: Combatant,
  passive: PassiveAbility
): boolean {
  if (!combatant.passiveStacks) return true;
  
  const stackState = combatant.passiveStacks.get(passive.id);
  if (!stackState) return true;
  
  // Verifica limite de ativações por batalha
  if (passive.maxActivationsPerBattle) {
    if (stackState.activationsThisBattle >= passive.maxActivationsPerBattle) {
      return false;
    }
  }
  
  // Verifica limite de ativações por rodada
  if (passive.maxActivationsPerRound) {
    if (stackState.activationsThisRound >= passive.maxActivationsPerRound) {
      return false;
    }
  }
  
  // Verifica cooldown
  if (stackState.cooldownRemaining > 0) {
    return false;
  }
  
  return true;
}

/**
 * Registra uma ativação de passiva
 */
export function recordPassiveActivation(
  combatant: Combatant,
  passiveId: string
): void {
  if (!combatant.passiveStacks) return;
  
  const stackState = combatant.passiveStacks.get(passiveId);
  if (!stackState) return;
  
  stackState.activationsThisBattle++;
  stackState.activationsThisRound++;
}

/**
 * Verifica se as condições de uma passiva são atendidas
 */
export function checkPassiveConditions(
  combatant: Combatant,
  passive: PassiveAbility,
  context: {
    targetHpPercent?: number;
    isFirstRound?: boolean;
    isCritical?: boolean;
  }
): boolean {
  if (!passive.conditions || passive.conditions.length === 0) {
    return true;
  }
  
  for (const condition of passive.conditions) {
    switch (condition.type) {
      case "hp_below_percent":
        const hpPercent = (combatant.hp / combatant.maxHp) * 100;
        if (hpPercent >= (condition.value ?? 0)) {
          return false;
        }
        break;
        
      case "target_hp_below_percent":
        if (!context.targetHpPercent) return false;
        if (context.targetHpPercent >= (condition.value ?? 0)) {
          return false;
        }
        break;
        
      case "is_first_round":
        if (!context.isFirstRound) return false;
        break;
        
      default:
        // Condição desconhecida, assume verdadeiro
        break;
    }
  }
  
  return true;
}
