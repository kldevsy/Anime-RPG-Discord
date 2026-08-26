/**
 * Sistema de Passivas Avançado
 * 
 * Define passivas funcionais com triggers, condições e efeitos que são
 * executados automaticamente durante batalhas.
 */

import type { Combatant, StatusType } from "./BattleState";

/**
 * Quando a passiva deve ser ativada
 */
export type PassiveTrigger =
  // Triggers de combate
  | "on_battle_start"        // Início da batalha
  | "on_round_start"          // Início de cada rodada
  | "on_turn_start"           // Início do turno do personagem
  | "on_turn_end"             // Fim do turno do personagem
  
  // Triggers de ataque
  | "on_basic_attack"         // Ao usar ataque básico
  | "on_skill_use"            // Ao usar qualquer skill
  | "on_ultimate_use"         // Ao usar ultimate
  | "on_hit"                  // Ao acertar qualquer ataque
  | "on_critical_hit"         // Ao dar crítico
  | "on_kill"                 // Ao derrotar inimigo
  
  // Triggers defensivos
  | "on_damaged"              // Ao receber dano
  | "on_hit_taken"            // Ao ser atingido
  | "on_critical_taken"       // Ao receber crítico
  | "on_dodge"                // Ao desviar (futuro)
  | "on_block"                // Ao bloquear (futuro)
  
  // Triggers de HP
  | "on_hp_below_threshold"   // Quando HP cai abaixo de X%
  | "on_hp_above_threshold"   // Quando HP está acima de X%
  | "on_low_hp"               // HP abaixo de 30%
  | "on_full_hp"              // HP em 100%
  | "on_near_death"           // HP abaixo de 10%
  
  // Triggers de status
  | "on_status_applied"       // Ao aplicar status em inimigo
  | "on_status_received"      // Ao receber status
  | "on_buff_gained"          // Ao ganhar buff
  | "on_debuff_received"      // Ao receber debuff
  
  // Triggers de aliados
  | "on_ally_defeated"        // Quando aliado morre
  | "on_ally_healed"          // Quando aliado é curado
  | "on_ally_low_hp"          // Quando aliado tem HP baixo
  
  // Triggers de inimigos
  | "on_enemy_defeated"       // Quando inimigo morre
  | "on_enemy_low_hp"         // Quando inimigo tem HP baixo
  
  // Triggers especiais
  | "on_revive"               // Ao ser revivido
  | "on_death"                // Ao morrer (antes de morrer)
  | "on_survived_lethal"      // Ao sobreviver a dano letal
  | "always";                 // Sempre ativo (passivo permanente)

/**
 * Condições que devem ser verdadeiras para a passiva ativar
 */
export interface PassiveCondition {
  type: 
    // Condições de HP
    | "hp_below_percent"
    | "hp_above_percent"
    | "hp_equals_percent"
    
    // Condições de alvos
    | "target_hp_below_percent"
    | "target_hp_above_percent"
    | "target_has_status"
    | "target_is_role"
    
    // Condições de status
    | "has_status"
    | "has_buff"
    | "has_debuff"
    | "status_count_above"
    
    // Condições de combate
    | "is_critical"
    | "damage_above"
    | "damage_below"
    | "first_hit"
    | "combo_count_above"
    
    // Condições de equipe
    | "allies_alive_below"
    | "allies_alive_above"
    | "enemies_alive_below"
    | "enemies_alive_above"
    | "is_last_standing"
    
    // Condições de rodada
    | "round_above"
    | "round_below"
    | "is_first_round"
    
    // Condições de chance
    | "random_chance"
    
    // Condições de role
    | "is_role"
    | "target_is_role";
  
  value?: number;
  statusType?: StatusType;
  role?: string;
}

/**
 * Efeitos que a passiva aplica quando ativada
 */
export interface PassiveEffect {
  type:
    // Efeitos de stats
    | "increase_attack"
    | "increase_defense"
    | "increase_speed"
    | "increase_hp"
    | "increase_crit_chance"
    | "increase_crit_damage"
    
    | "decrease_attack"
    | "decrease_defense"
    | "decrease_speed"
    
    // Efeitos de dano
    | "bonus_damage"
    | "bonus_damage_percent"
    | "reflect_damage"
    | "lifesteal"
    | "extra_hit"
    
    // Efeitos de cura
    | "heal_self"
    | "heal_percent"
    | "heal_ally"
    | "regeneration"
    
    // Efeitos de status
    | "apply_status"
    | "cleanse_debuff"
    | "prevent_debuff"
    | "extend_buff"
    | "remove_status"
    
    // Efeitos de proteção
    | "damage_reduction"
    | "shield"
    | "invulnerability"
    | "revive_self"
    | "prevent_death"
    
    // Efeitos de energia/carga
    | "gain_energy"
    | "gain_ultimate_charge"
    | "reduce_cooldown"
    | "reset_skill"
    
    // Efeitos de controle
    | "stun_attacker"
    | "freeze_attacker"
    | "counter_attack"
    | "retaliate"
    
    // Efeitos especiais
    | "dispel_buffs"
    | "steal_buff"
    | "copy_buff"
    | "chain_to_enemy"
    | "execute_low_hp"
    
    // Efeitos de modificadores
    | "multiply_next_damage"
    | "guarantee_crit"
    | "double_action"
    | "extra_turn";
  
  value: number;
  duration?: number;
  statusType?: StatusType;
  chance?: number; // Chance de aplicar (0-100)
  target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy";
}

/**
 * Definição completa de uma passiva
 */
export interface PassiveAbility {
  id: string;
  name: string;
  description: string;
  trigger: PassiveTrigger;
  conditions?: PassiveCondition[];
  effects: PassiveEffect[];
  maxActivationsPerBattle?: number;
  maxActivationsPerRound?: number;
  cooldownRounds?: number;
  priority?: number; // Maior = executa primeiro
}

/**
 * Estado de ativação de passivas para tracking
 */
export interface PassiveActivationState {
  passiveId: string;
  activationsThisBattle: number;
  activationsThisRound: number;
  lastActivatedRound: number;
  cooldownRemaining: number;
}

/**
 * Contexto passado para avaliação de passivas
 */
export interface PassiveContext {
  owner: Combatant;
  trigger: PassiveTrigger;
  round: number;
  
  // Contexto de ação
  actor?: Combatant;
  target?: Combatant;
  damage?: number;
  isCritical?: boolean;
  skillUsed?: string;
  
  // Contexto de status
  statusApplied?: StatusType;
  statusReceived?: StatusType;
  
  // Times
  allies: Combatant[];
  enemies: Combatant[];
  
  // Resultado modificável
  modifiedDamage?: number;
  preventAction?: boolean;
}

/**
 * Resultado da execução de uma passiva
 */
export interface PassiveExecutionResult {
  activated: boolean;
  passiveName: string;
  effects: Array<{
    type: string;
    target: string;
    value: number;
    success: boolean;
  }>;
  message?: string;
}
