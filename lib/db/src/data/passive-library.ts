/**
 * Biblioteca de Passivas Predefinidas
 * 
 * Catálogo reutilizável de passivas com diferentes efeitos e mecânicas.
 * Use estas passivas prontas ou como inspiração para criar novas.
 */

import type { PassiveAbility } from "./characters";

/**
 * PASSIVAS OFENSIVAS - Aumentam dano e poder de ataque
 */

export const BERSERKER_RAGE: PassiveAbility = {
  id: "berserker_rage",
  name: "Fúria Berserker",
  description: "Ganha 30% de ataque quando HP está abaixo de 50%",
  trigger: "on_hp_below_threshold",
  conditions: [{ type: "hp_below_percent", value: 50 }],
  effects: [
    { type: "increase_attack", value: 30, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

export const CRITICAL_MASTER: PassiveAbility = {
  id: "critical_master",
  name: "Mestre dos Críticos",
  description: "Ao dar crítico, próximo ataque tem +50% de dano",
  trigger: "on_critical_hit",
  effects: [
    { type: "bonus_damage_percent", value: 50, target: "self" }
  ],
  maxActivationsPerRound: 1,
};

export const EXECUTIONER: PassiveAbility = {
  id: "executioner",
  name: "Executor",
  description: "Causa 40% de dano adicional em inimigos com HP abaixo de 30%",
  trigger: "on_hit",
  conditions: [{ type: "target_hp_below_percent", value: 30 }],
  effects: [
    { type: "bonus_damage_percent", value: 40, target: "self" }
  ],
};

export const COMBO_MASTER: PassiveAbility = {
  id: "combo_master",
  name: "Mestre do Combo",
  description: "A cada 3 ataques, o próximo causa dano dobrado",
  trigger: "on_basic_attack",
  effects: [
    { type: "multiply_next_damage", value: 2, target: "self" }
  ],
  maxActivationsPerRound: 1,
};

export const BLOODLUST: PassiveAbility = {
  id: "bloodlust",
  name: "Sede de Sangue",
  description: "Ao derrotar um inimigo, ganha 40% de ataque por 2 turnos",
  trigger: "on_kill",
  effects: [
    { type: "apply_status", value: 40, duration: 2, statusType: "attack_up", target: "self" }
  ],
};

/**
 * PASSIVAS DEFENSIVAS - Proteção e sobrevivência
 */

export const IRON_WILL: PassiveAbility = {
  id: "iron_will",
  name: "Vontade de Ferro",
  description: "Sobrevive com 1 HP ao receber dano letal (1x por batalha)",
  trigger: "on_damaged",
  conditions: [{ type: "hp_below_percent", value: 1 }],
  effects: [
    { type: "prevent_death", value: 1, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

export const LAST_STAND: PassiveAbility = {
  id: "last_stand",
  name: "Última Resistência",
  description: "Quando é o último aliado vivo, ganha 50% defesa e 30% ataque",
  trigger: "on_round_start",
  conditions: [{ type: "is_last_standing" }],
  effects: [
    { type: "increase_defense", value: 50, target: "self" },
    { type: "increase_attack", value: 30, target: "self" }
  ],
};

export const GUARDIAN_SHIELD: PassiveAbility = {
  id: "guardian_shield",
  name: "Escudo Guardião",
  description: "No início da batalha, ganha um escudo de 300 HP",
  trigger: "on_battle_start",
  effects: [
    { type: "shield", value: 300, duration: 99, target: "self" }
  ],
};

export const DAMAGE_REDUCTION: PassiveAbility = {
  id: "damage_reduction",
  name: "Redução de Dano",
  description: "Reduz todo dano recebido em 20%",
  trigger: "on_damaged",
  effects: [
    { type: "damage_reduction", value: 20, target: "self" }
  ],
};

export const THORNS: PassiveAbility = {
  id: "thorns",
  name: "Espinhos",
  description: "Reflete 30% do dano recebido de volta ao atacante",
  trigger: "on_damaged",
  effects: [
    { type: "reflect_damage", value: 30, target: "attacker" }
  ],
};

export const COUNTER_STRIKE: PassiveAbility = {
  id: "counter_strike",
  name: "Contra-ataque",
  description: "40% de chance de contra-atacar ao ser atingido",
  trigger: "on_hit_taken",
  effects: [
    { type: "counter_attack", value: 80, chance: 40, target: "attacker" }
  ],
};

/**
 * PASSIVAS DE CURA E SUPORTE
 */

export const REGENERATION: PassiveAbility = {
  id: "regeneration",
  name: "Regeneração",
  description: "Cura 5% do HP máximo no início de cada turno",
  trigger: "on_turn_start",
  effects: [
    { type: "heal_percent", value: 5, target: "self" }
  ],
};

export const VAMPIRE: PassiveAbility = {
  id: "vampire",
  name: "Vampirismo",
  description: "Cura 20% do dano causado",
  trigger: "on_hit",
  effects: [
    { type: "lifesteal", value: 20, target: "self" }
  ],
};

export const GUARDIAN_ANGEL: PassiveAbility = {
  id: "guardian_angel",
  name: "Anjo Guardião",
  description: "Quando um aliado tem HP abaixo de 30%, cura 200 HP",
  trigger: "on_ally_low_hp",
  conditions: [{ type: "target_hp_below_percent", value: 30 }],
  effects: [
    { type: "heal_self", value: 200, target: "lowest_hp_ally" }
  ],
  maxActivationsPerRound: 1,
};

export const TEAM_HEAL: PassiveAbility = {
  id: "team_heal",
  name: "Cura em Equipe",
  description: "No início de cada rodada, cura todos os aliados em 3% do HP máximo",
  trigger: "on_round_start",
  effects: [
    { type: "heal_percent", value: 3, target: "allies" }
  ],
};

export const PURIFY: PassiveAbility = {
  id: "purify",
  name: "Purificar",
  description: "Remove 1 debuff de si mesmo no início do turno",
  trigger: "on_turn_start",
  effects: [
    { type: "cleanse_debuff", value: 1, target: "self" }
  ],
};

/**
 * PASSIVAS DE VELOCIDADE E MOBILIDADE
 */

export const SWIFT_STRIKE: PassiveAbility = {
  id: "swift_strike",
  name: "Ataque Veloz",
  description: "Inicia a batalha com +30 de velocidade",
  trigger: "on_battle_start",
  effects: [
    { type: "increase_speed", value: 30, target: "self" }
  ],
};

export const MOMENTUM: PassiveAbility = {
  id: "momentum",
  name: "Momentum",
  description: "Ganha +10 de velocidade a cada ataque bem-sucedido (máx 3 stacks)",
  trigger: "on_hit",
  effects: [
    { type: "increase_speed", value: 10, target: "self" }
  ],
  maxActivationsPerBattle: 3,
};

export const FIRST_STRIKE: PassiveAbility = {
  id: "first_strike",
  name: "Primeiro Golpe",
  description: "No primeiro turno, causa 80% de dano adicional",
  trigger: "on_hit",
  conditions: [{ type: "is_first_round" }],
  effects: [
    { type: "bonus_damage_percent", value: 80, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

/**
 * PASSIVAS DE ENERGIA E ULTIMATE
 */

export const ENERGY_BATTERY: PassiveAbility = {
  id: "energy_battery",
  name: "Bateria de Energia",
  description: "Ao receber dano, ganha 5 de carga de ultimate",
  trigger: "on_damaged",
  effects: [
    { type: "gain_ultimate_charge", value: 5, target: "self" }
  ],
};

export const QUICK_CHARGE: PassiveAbility = {
  id: "quick_charge",
  name: "Carga Rápida",
  description: "Ganha 15 de carga de ultimate no início da batalha",
  trigger: "on_battle_start",
  effects: [
    { type: "gain_ultimate_charge", value: 15, target: "self" }
  ],
};

export const COOLDOWN_MASTER: PassiveAbility = {
  id: "cooldown_master",
  name: "Mestre do Cooldown",
  description: "Ao usar skill, reduz cooldown de todas as skills em 1 turno",
  trigger: "on_skill_use",
  effects: [
    { type: "reduce_cooldown", value: 1, target: "self" }
  ],
};

/**
 * PASSIVAS ESPECIAIS E ÚNICAS
 */

export const SHARINGAN: PassiveAbility = {
  id: "sharingan",
  name: "Sharingan",
  description: "Aumenta chance de crítico em 15% e dano crítico em 30%",
  trigger: "on_battle_start",
  effects: [
    { type: "increase_crit_chance", value: 15, target: "self" },
    { type: "increase_crit_damage", value: 30, target: "self" }
  ],
};

export const BATTLE_INSTINCT: PassiveAbility = {
  id: "battle_instinct",
  name: "Instinto de Batalha",
  description: "Ao sobreviver a um crítico, ganha 40% de ataque por 2 turnos",
  trigger: "on_critical_taken",
  effects: [
    { type: "apply_status", value: 40, duration: 2, statusType: "attack_up", target: "self" }
  ],
  maxActivationsPerRound: 1,
};

export const CHAKRA_CONTROL: PassiveAbility = {
  id: "chakra_control",
  name: "Controle de Chakra",
  description: "Cura o aliado com menor HP em 150 no início de cada rodada",
  trigger: "on_round_start",
  effects: [
    { type: "heal_self", value: 150, target: "lowest_hp_ally" }
  ],
};

export const RESILIENCE: PassiveAbility = {
  id: "resilience",
  name: "Resiliência",
  description: "Reduz o primeiro dano recebido na batalha em 50%",
  trigger: "on_damaged",
  effects: [
    { type: "damage_reduction", value: 50, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

export const SPIRITUAL_PRESSURE: PassiveAbility = {
  id: "spiritual_pressure",
  name: "Pressão Espiritual",
  description: "30% de chance de causar 20% de dano adicional",
  trigger: "on_hit",
  effects: [
    { type: "bonus_damage_percent", value: 20, chance: 30, target: "self" }
  ],
};

export const DETERMINATION: PassiveAbility = {
  id: "determination",
  name: "Determinação",
  description: "Quando HP está abaixo de 50%, ganha 25% de ataque",
  trigger: "always",
  conditions: [{ type: "hp_below_percent", value: 50 }],
  effects: [
    { type: "increase_attack", value: 25, target: "self" }
  ],
};

export const WATER_BREATHING: PassiveAbility = {
  id: "water_breathing",
  name: "Respiração da Água",
  description: "Reduz dano recebido em 15% e aumenta velocidade em 10",
  trigger: "on_battle_start",
  effects: [
    { type: "increase_speed", value: 10, target: "self" },
    { type: "increase_defense", value: 15, target: "self" }
  ],
};

export const SUPERHUMAN_STRENGTH: PassiveAbility = {
  id: "superhuman_strength",
  name: "Força Sobre-humana",
  description: "Ao dar crítico, ganha 10 de carga de ultimate",
  trigger: "on_critical_hit",
  effects: [
    { type: "gain_ultimate_charge", value: 10, target: "self" }
  ],
};

export const THREE_SWORD_STYLE: PassiveAbility = {
  id: "three_sword_style",
  name: "Santoryu (Três Espadas)",
  description: "Ataques básicos têm 25% de chance de aplicar sangramento por 3 turnos",
  trigger: "on_basic_attack",
  effects: [
    { type: "apply_status", value: 50, duration: 3, statusType: "bleed", chance: 25, target: "target" }
  ],
};

/**
 * PASSIVAS DE JUJUTSU KAISEN - TÉCNICAS AMALDIÇOADAS
 */

export const DEADLY_SENTENCING: PassiveAbility = {
  id: "deadly_sentencing",
  name: "Sentença Mortal",
  description: "Ao ser atacado, tem 30% de chance de confiscar 20% do ATK do inimigo por 2 turnos (stackável)",
  trigger: "on_damaged",
  effects: [
    { type: "steal_stats", value: 20, duration: 2, statType: "attack", chance: 30, target: "attacker" }
  ],
};

export const IDLE_TRANSFIGURATION: PassiveAbility = {
  id: "idle_transfiguration",
  name: "Transfiguração Ociosa",
  description: "Ao acertar, tem 25% de chance de reduzir HP máximo do inimigo em 8% permanentemente",
  trigger: "on_hit",
  effects: [
    { type: "reduce_max_hp", value: 8, chance: 25, target: "target" }
  ],
};

export const RATIO_TECHNIQUE: PassiveAbility = {
  id: "ratio_technique",
  name: "Técnica 7:3",
  description: "Ataques críticos causam 40% de dano extra e ignoram 25% da defesa do alvo",
  trigger: "on_critical_hit",
  effects: [
    { type: "damage_bonus", value: 40, target: "self" },
    { type: "ignore_defense", value: 25, target: "self" }
  ],
};

export const CURSED_SPIRIT_MANIPULATION: PassiveAbility = {
  id: "cursed_spirit_manipulation",
  name: "Manipulação de Espíritos",
  description: "Ao matar inimigo, recupera 15% do HP máximo e ganha 30 de carga de ultimate",
  trigger: "on_kill",
  effects: [
    { type: "heal_percent", value: 15, target: "self" },
    { type: "gain_ultimate_charge", value: 30, target: "self" }
  ],
};

/**
 * PASSIVAS DE DEMON SLAYER - LUAS SUPERIORES
 */

export const MOON_BREATHING: PassiveAbility = {
  id: "moon_breathing",
  name: "Respiração da Lua",
  description: "Cada ataque tem 35% de chance de aplicar sangramento e reduzir velocidade do alvo em 15% por 2 turnos",
  trigger: "on_hit",
  effects: [
    { type: "apply_status", value: 40, duration: 3, statusType: "bleed", chance: 35, target: "target" },
    { type: "apply_status", value: 15, duration: 2, statusType: "speed_down", chance: 35, target: "target" }
  ],
};

export const ICE_MANIPULATION: PassiveAbility = {
  id: "ice_manipulation",
  name: "Criotécnica de Sangue",
  description: "Ao ser atacado, tem 40% de chance de congelar o atacante por 1 turno",
  trigger: "on_damaged",
  effects: [
    { type: "apply_status", value: 0, duration: 1, statusType: "freeze", chance: 40, target: "attacker" }
  ],
};

export const FIGHTING_SPIRIT: PassiveAbility = {
  id: "fighting_spirit",
  name: "Espírito de Luta",
  description: "Quanto menor o HP, mais forte fica: ganha 2% de ATK por cada 10% de HP perdido",
  trigger: "always",
  conditions: [{ type: "hp_below_percent", value: 90 }],
  effects: [
    { type: "increase_attack", value: 2, target: "self" }
  ],
};

export const POISON_MASTERY: PassiveAbility = {
  id: "poison_mastery",
  name: "Mestre do Veneno",
  description: "Ataques têm 50% de chance de envenenar por 4 turnos, veneno causa 20% mais dano",
  trigger: "on_hit",
  effects: [
    { type: "apply_status", value: 40, duration: 4, statusType: "poison", chance: 50, target: "target" }
  ],
};

/**
 * PASSIVAS DE DEMON SLAYER - PERSONAGENS FEMININAS
 */

export const SILK_MANIPULATION: PassiveAbility = {
  id: "silk_manipulation",
  name: "Manipulação de Faixas",
  description: "Ao acertar crítico, reduz a velocidade de todos os inimigos em 10% por 2 turnos (stackável)",
  trigger: "on_critical_hit",
  effects: [
    { type: "apply_status", value: 10, duration: 2, statusType: "speed_down", chance: 100, target: "all_enemies" }
  ],
};

export const INFINITY_CASTLE: PassiveAbility = {
  id: "infinity_castle",
  name: "Castelo Infinito",
  description: "No início de cada rodada, todos os aliados ganham 15 de carga de ultimate",
  trigger: "on_round_start",
  effects: [
    { type: "gain_ultimate_charge", value: 15, target: "all_allies" }
  ],
};

export const DEMON_TRANSFORMATION: PassiveAbility = {
  id: "demon_transformation",
  name: "Transformação Demoníaca",
  description: "Ao cair abaixo de 40% HP, entra em modo berserker: +40% ATK, +25% SPD, +30% chance crítica",
  trigger: "on_damaged",
  conditions: [{ type: "hp_below_percent", value: 40 }],
  effects: [
    { type: "increase_attack", value: 40, target: "self" },
    { type: "increase_speed", value: 25, target: "self" },
    { type: "increase_crit_chance", value: 30, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

/**
 * PASSIVAS LENDÁRIAS - PERSONAGENS ICÔNICOS
 */

export const ETERNAL_MANGEKYO: PassiveAbility = {
  id: "eternal_mangekyo",
  name: "Mangekyō Sharingan Eterno",
  description: "Cada ataque básico tem 30% de chance de ativar Susanoo: ganha escudo e próximo ataque causa 50% mais dano",
  trigger: "on_basic_attack",
  effects: [
    { type: "shield", value: 200, chance: 30, target: "self" },
    { type: "bonus_damage_percent", value: 50, chance: 30, target: "self" }
  ],
  cooldownRounds: 2,
};

export const GORO_GORO_NO_MI: PassiveAbility = {
  id: "goro_goro_no_mi",
  name: "Fruta Goro Goro no Mi",
  description: "Ao acertar, tem 45% de chance de aplicar choque. Inimigos chocados ficam 20% mais lentos",
  trigger: "on_hit",
  effects: [
    { type: "apply_status", value: 35, duration: 3, statusType: "shock", chance: 45, target: "target" },
    { type: "apply_status", value: 20, duration: 2, statusType: "speed_down", chance: 45, target: "target" }
  ],
};

export const THE_ONE: PassiveAbility = {
  id: "the_one",
  name: "The One",
  description: "A cada rodada, ganha 5% de ATK e DEF permanentemente (máx 10 stacks). Ao atingir 50% de stack, se torna imune a debuffs",
  trigger: "on_round_start",
  effects: [
    { type: "increase_attack", value: 5, target: "self" },
    { type: "increase_defense", value: 5, target: "self" }
  ],
  maxActivationsPerBattle: 10,
};

/**
 * PASSIVAS DE MELIODAS - SEVEN DEADLY SINS
 */

export const FULL_COUNTER: PassiveAbility = {
  id: "full_counter",
  name: "Full Counter",
  description: "Ao receber dano, tem 35% de chance de refletir 120% do dano recebido de volta ao atacante",
  trigger: "on_damaged",
  effects: [
    { type: "reflect_damage", value: 120, chance: 35, target: "attacker" }
  ],
};

export const DEMON_MARK: PassiveAbility = {
  id: "demon_mark",
  name: "Marca Demoníaca",
  description: "Cada ataque básico reduz a cura dos inimigos em 5% (stackável até 50%). Ao atingir 30%+, ganha 20% de velocidade",
  trigger: "on_basic_attack",
  effects: [
    { type: "reduce_healing", value: 5, target: "target" },
  ],
};

export const ASSAULT_MODE: PassiveAbility = {
  id: "assault_mode",
  name: "Assault Mode",
  description: "Ganha 2% de ATK por cada 1% de HP perdido (máx 100%). Ao cair abaixo de 30% HP, ganha 50% de chance crítica adicional",
  trigger: "on_damaged",
  effects: [
    { type: "increase_attack_per_missing_hp", value: 2, target: "self" },
  ],
  conditions: [{ type: "hp_below_percent", value: 30 }],
  conditionalEffects: [
    { type: "increase_crit_chance", value: 50, target: "self" }
  ],
};

/**
 * PASSIVAS DE NARUTO - AKATSUKI
 */

export const RINNEGAN: PassiveAbility = {
  id: "rinnegan",
  name: "Rinnegan",
  description: "Cada habilidade usada (basic ou ultimate) ganha 10 de carga adicional. A cada 3 ataques, o próximo ataque atordoa o alvo",
  trigger: "on_ability_use",
  effects: [
    { type: "gain_ultimate_charge", value: 10, target: "self" },
  ],
  stackCounter: 3,
  stackEffect: { type: "apply_status", statusType: "stun", duration: 1, chance: 100, target: "next_target" }
};

/**
 * PASSIVAS DE JUJUTSU KAISEN - FEITICEIROS ESPECIAIS
 */

export const COPY_TECHNIQUE: PassiveAbility = {
  id: "copy_technique",
  name: "Cópia de Técnicas",
  description: "Ao ser acertado por um debuff, tem 40% de chance de copiar e aplicar o mesmo debuff no atacante",
  trigger: "on_debuffed",
  effects: [
    { type: "copy_debuff", chance: 40, target: "attacker" }
  ],
};

export const RIKA_MANIFESTATION: PassiveAbility = {
  id: "rika_manifestation",
  name: "Manifestação de Rika",
  description: "Ao cair abaixo de 50% HP, Rika se manifesta: ganha escudo de 400 HP, +30% ATK, +25% DEF, +20% SPD (1x por batalha)",
  trigger: "on_damaged",
  conditions: [{ type: "hp_below_percent", value: 50 }],
  effects: [
    { type: "shield", value: 400, target: "self" },
    { type: "increase_attack", value: 30, target: "self" },
    { type: "increase_defense", value: 25, target: "self" },
    { type: "increase_speed", value: 20, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

/**
 * PASSIVAS DE BOSS E INIMIGOS ESPECIAIS
 */

export const ENRAGE: PassiveAbility = {
  id: "enrage",
  name: "Enfurecer",
  description: "Após rodada 5, ganha 60% de ataque e 30% de velocidade",
  trigger: "on_round_start",
  conditions: [{ type: "round_above", value: 5 }],
  effects: [
    { type: "apply_status", value: 60, duration: 99, statusType: "attack_up", target: "self" },
    { type: "apply_status", value: 30, duration: 99, statusType: "speed_up", target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

export const PHASE_TRANSITION: PassiveAbility = {
  id: "phase_transition",
  name: "Transição de Fase",
  description: "Ao mudar de fase, limpa todos os debuffs e ganha escudo de 500",
  trigger: "on_hp_below_threshold",
  conditions: [{ type: "hp_below_percent", value: 50 }],
  effects: [
    { type: "cleanse_debuff", value: 99, target: "self" },
    { type: "shield", value: 500, duration: 5, target: "self" }
  ],
  maxActivationsPerBattle: 1,
};

export const AOE_PUNISHMENT: PassiveAbility = {
  id: "aoe_punishment",
  name: "Punição em Área",
  description: "Ao ser atacado, 20% de chance de causar 100 de dano em todos os inimigos",
  trigger: "on_hit_taken",
  effects: [
    { type: "bonus_damage", value: 100, chance: 20, target: "enemies" }
  ],
  maxActivationsPerRound: 2,
};

/**
 * Catálogo completo de passivas
 */
export const PASSIVE_LIBRARY: Record<string, PassiveAbility> = {
  // Ofensivas
  berserker_rage: BERSERKER_RAGE,
  critical_master: CRITICAL_MASTER,
  executioner: EXECUTIONER,
  combo_master: COMBO_MASTER,
  bloodlust: BLOODLUST,
  
  // Defensivas
  iron_will: IRON_WILL,
  last_stand: LAST_STAND,
  guardian_shield: GUARDIAN_SHIELD,
  damage_reduction: DAMAGE_REDUCTION,
  thorns: THORNS,
  counter_strike: COUNTER_STRIKE,
  
  // Cura e Suporte
  regeneration: REGENERATION,
  vampire: VAMPIRE,
  guardian_angel: GUARDIAN_ANGEL,
  team_heal: TEAM_HEAL,
  purify: PURIFY,
  
  // Velocidade
  swift_strike: SWIFT_STRIKE,
  momentum: MOMENTUM,
  first_strike: FIRST_STRIKE,
  
  // Energia/Ultimate
  energy_battery: ENERGY_BATTERY,
  quick_charge: QUICK_CHARGE,
  cooldown_master: COOLDOWN_MASTER,
  
  // Especiais
  sharingan: SHARINGAN,
  battle_instinct: BATTLE_INSTINCT,
  chakra_control: CHAKRA_CONTROL,
  resilience: RESILIENCE,
  spiritual_pressure: SPIRITUAL_PRESSURE,
  determination: DETERMINATION,
  water_breathing: WATER_BREATHING,
  superhuman_strength: SUPERHUMAN_STRENGTH,
  three_sword_style: THREE_SWORD_STYLE,
  
  // Boss
  enrage: ENRAGE,
  phase_transition: PHASE_TRANSITION,
  aoe_punishment: AOE_PUNISHMENT,
};

/**
 * Helper para obter passiva da biblioteca
 */
export function getPassiveById(id: string): PassiveAbility | undefined {
  return PASSIVE_LIBRARY[id];
}

/**
 * Helper para criar variação de passiva existente
 */
export function createPassiveVariant(
  baseId: string,
  overrides: Partial<PassiveAbility>
): PassiveAbility | undefined {
  const base = getPassiveById(baseId);
  if (!base) return undefined;
  
  return {
    ...base,
    ...overrides,
    id: overrides.id ?? `${baseId}_variant`,
  };
}
