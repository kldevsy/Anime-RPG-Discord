import type { Equipment } from "../schema/index.ts";
import { PASSIVE_LIBRARY } from "./passive-library.ts";

/**
 * 📦 Catálogo de Equipamentos
 * 
 * Regras:
 * - Cada personagem equipa 1 item apenas
 * - Stats fixos (sem RNG)
 * - Equipável: character (sempre passiva), role (passiva opcional), universal (passiva rara)
 * - Raridades: common → mythic
 */

type EquipmentCatalog = Omit<Equipment, "id" | "createdAt">;

export const EQUIPMENT_CATALOG: EquipmentCatalog[] = [
  // ============================================
  // 🥇 EQUIPAMENTOS DE PERSONAGEM ESPECÍFICO
  // (Sempre têm passiva)
  // ============================================
  
  // ZORO - Épico
  {
    name: "Bandana do Zoro",
    rarity: "epic",
    description: "A icônica bandana verde que Zoro usa em batalhas sérias",
    equipableType: "character",
    equipableTarget: "Roronoa Zoro",
    bonusHp: 0,
    bonusAttack: 80,
    bonusDefense: 0,
    bonusSpeed: 30,
    bonusCritChance: 10,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "three_sword_mastery",
      name: "Maestria das Três Espadas",
      description: "Ataques básicos têm 30% de chance de atacar 3 vezes seguidas",
      trigger: "on_attack",
      effects: [{
        type: "multi_attack",
        target: "self",
        value: 3,
        chance: 30
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // GOJO - Mítico
  {
    name: "Venda dos Seis Olhos",
    rarity: "mythic",
    description: "Venda que sela o poder avassalador dos Seis Olhos de Gojo",
    equipableType: "character",
    equipableTarget: "Satoru Gojo",
    bonusHp: 0,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusSpeed: 50,
    bonusCritChance: 20,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "six_eyes_power",
      name: "Poder dos Seis Olhos",
      description: "Ganha +30 de carga de ultimate por turno",
      trigger: "on_turn_start",
      effects: [{
        type: "ultimate_charge",
        target: "self",
        value: 30
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // NARUTO - Lendário
  {
    name: "Colar de Tsunade",
    rarity: "legendary",
    description: "Colar precioso dado por Tsunade a Naruto",
    equipableType: "character",
    equipableTarget: "Naruto Uzumaki",
    bonusHp: 150,
    bonusAttack: 80,
    bonusDefense: 50,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "nine_tails_awakening",
      name: "Despertar da Nove Caudas",
      description: "Ao ficar abaixo de 40% HP, ganha +50% ATK e +30% SPD por 3 turnos",
      trigger: "on_hp_threshold",
      effects: [
        {
          type: "stat_boost",
          target: "self",
          stat: "attack",
          value: 50,
          duration: 3
        },
        {
          type: "stat_boost",
          target: "self",
          stat: "speed",
          value: 30,
          duration: 3
        }
      ]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // SASUKE - Lendário
  {
    name: "Lâmina Kusanagi",
    rarity: "legendary",
    description: "Espada lendária usada por Sasuke e Orochimaru",
    equipableType: "character",
    equipableTarget: "Sasuke Uchiha",
    bonusHp: 0,
    bonusAttack: 120,
    bonusDefense: 0,
    bonusSpeed: 40,
    bonusCritChance: 15,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "chidori_blade",
      name: "Lâmina Chidori",
      description: "Críticos causam +40% de dano e aplicam Paralisia por 1 turno",
      trigger: "on_critical_hit",
      effects: [
        {
          type: "damage_boost",
          target: "self",
          value: 40
        },
        {
          type: "apply_status",
          target: "target",
          status: "paralyzed",
          duration: 1
        }
      ]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // LUFFY - Épico
  {
    name: "Chapéu de Palha",
    rarity: "epic",
    description: "O icônico chapéu de palha de Shanks",
    equipableType: "character",
    equipableTarget: "Monkey D. Luffy",
    bonusHp: 120,
    bonusAttack: 60,
    bonusDefense: 40,
    bonusSpeed: 30,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "pirate_king_will",
      name: "Vontade do Rei dos Piratas",
      description: "Ao usar ultimate, ganha +30% ATK e DEF por 2 turnos",
      trigger: "on_ultimate_use",
      effects: [
        {
          type: "stat_boost",
          target: "self",
          stat: "attack",
          value: 30,
          duration: 2
        },
        {
          type: "stat_boost",
          target: "self",
          stat: "defense",
          value: 30,
          duration: 2
        }
      ]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // ITACHI - Mítico
  {
    name: "Akatsuki Coat",
    rarity: "mythic",
    description: "Manto oficial da organização Akatsuki",
    equipableType: "character",
    equipableTarget: "Itachi Uchiha",
    bonusHp: 100,
    bonusAttack: 100,
    bonusDefense: 80,
    bonusSpeed: 50,
    bonusCritChance: 10,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "tsukuyomi_genjutsu",
      name: "Genjutsu: Tsukuyomi",
      description: "Ataques têm 20% de chance de aplicar Stun por 1 turno",
      trigger: "on_attack",
      effects: [{
        type: "apply_status",
        target: "target",
        status: "stunned",
        duration: 1,
        chance: 20
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // MELIODAS - Lendário
  {
    name: "Espada Demoníaca",
    rarity: "legendary",
    description: "Espada que amplifica o poder demoníaco de Meliodas",
    equipableType: "character",
    equipableTarget: "Meliodas",
    bonusHp: 80,
    bonusAttack: 130,
    bonusDefense: 60,
    bonusSpeed: 0,
    bonusCritChance: 12,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "full_counter_amp",
      name: "Full Counter Amplificado",
      description: "Ao receber dano, contra-ataca com 50% do dano recebido",
      trigger: "on_damage_taken",
      effects: [{
        type: "counter_damage",
        target: "attacker",
        value: 50
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // TANJIRO - Épico
  {
    name: "Espada Nichirin Preta",
    rarity: "epic",
    description: "Espada Nichirin de cor preta única de Tanjiro",
    equipableType: "character",
    equipableTarget: "Tanjiro Kamado",
    bonusHp: 70,
    bonusAttack: 90,
    bonusDefense: 50,
    bonusSpeed: 35,
    bonusCritChance: 8,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "sun_breathing_amp",
      name: "Dança do Deus do Fogo",
      description: "Ataques queimam o inimigo causando 15% do ATK como dano por 2 turnos",
      trigger: "on_attack",
      effects: [{
        type: "apply_status",
        target: "target",
        status: "burned",
        duration: 2,
        value: 15
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // ============================================
  // ⚔️ EQUIPAMENTOS DE CLASSE - DPS
  // (Passiva opcional)
  // ============================================

  {
    name: "Katana Afiada",
    rarity: "epic",
    description: "Katana extremamente afiada para DPS",
    equipableType: "role",
    equipableTarget: "dps",
    bonusHp: 0,
    bonusAttack: 100,
    bonusDefense: 0,
    bonusSpeed: 0,
    bonusCritChance: 15,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "sharp_blade",
      name: "Lâmina Afiada",
      description: "Críticos causam +30% de dano",
      trigger: "on_critical_hit",
      effects: [{
        type: "damage_boost",
        target: "self",
        value: 30
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Adaga Rápida",
    rarity: "rare",
    description: "Adaga leve que aumenta velocidade e ataque",
    equipableType: "role",
    equipableTarget: "dps",
    bonusHp: 0,
    bonusAttack: 60,
    bonusDefense: 0,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Espada Vampírica",
    rarity: "legendary",
    description: "Espada que drena vida dos inimigos",
    equipableType: "role",
    equipableTarget: "dps",
    bonusHp: 0,
    bonusAttack: 110,
    bonusDefense: 0,
    bonusSpeed: 20,
    bonusCritChance: 10,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "lifesteal",
      name: "Roubo de Vida",
      description: "Ataques recuperam 15% do dano causado como HP",
      trigger: "on_attack",
      effects: [{
        type: "lifesteal",
        target: "self",
        value: 15
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // ============================================
  // 🛡️ EQUIPAMENTOS DE CLASSE - TANK
  // (Passiva opcional)
  // ============================================

  {
    name: "Escudo Indestrutível",
    rarity: "legendary",
    description: "Escudo que protege contra ataques fatais",
    equipableType: "role",
    equipableTarget: "tank",
    bonusHp: 200,
    bonusAttack: 0,
    bonusDefense: 120,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "unbreakable",
      name: "Indestrutível",
      description: "Ao receber dano fatal, sobrevive com 1 HP (1x por batalha)",
      trigger: "on_lethal_damage",
      effects: [{
        type: "survive_fatal",
        target: "self",
        value: 1
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Armadura Pesada",
    rarity: "epic",
    description: "Armadura que aumenta HP e defesa",
    equipableType: "role",
    equipableTarget: "tank",
    bonusHp: 180,
    bonusAttack: 0,
    bonusDefense: 90,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "fortify",
      name: "Fortificar",
      description: "Ao receber dano, ganha +15% DEF por 2 turnos (acumula até 3x)",
      trigger: "on_damage_taken",
      effects: [{
        type: "stat_boost",
        target: "self",
        stat: "defense",
        value: 15,
        duration: 2
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Placa de Aço",
    rarity: "rare",
    description: "Placa de aço resistente",
    equipableType: "role",
    equipableTarget: "tank",
    bonusHp: 120,
    bonusAttack: 0,
    bonusDefense: 70,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  // ============================================
  // 💊 EQUIPAMENTOS DE CLASSE - HEALER
  // (Passiva opcional)
  // ============================================

  {
    name: "Cajado da Cura",
    rarity: "epic",
    description: "Cajado mágico que amplifica curas",
    equipableType: "role",
    equipableTarget: "healer",
    bonusHp: 100,
    bonusAttack: 0,
    bonusDefense: 60,
    bonusSpeed: 30,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "healing_boost",
      name: "Amplificar Cura",
      description: "Curas são 30% mais efetivas",
      trigger: "on_heal",
      effects: [{
        type: "heal_boost",
        target: "self",
        value: 30
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Amuleto da Vida",
    rarity: "rare",
    description: "Amuleto que regenera HP gradualmente",
    equipableType: "role",
    equipableTarget: "healer",
    bonusHp: 80,
    bonusAttack: 0,
    bonusDefense: 50,
    bonusSpeed: 20,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  // ============================================
  // 🎯 EQUIPAMENTOS DE CLASSE - CONTROL
  // (Passiva opcional)
  // ============================================

  {
    name: "Orbe do Controle",
    rarity: "legendary",
    description: "Orbe místico que amplifica debuffs",
    equipableType: "role",
    equipableTarget: "control",
    bonusHp: 80,
    bonusAttack: 70,
    bonusDefense: 60,
    bonusSpeed: 50,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "extended_debuffs",
      name: "Debuffs Prolongados",
      description: "Debuffs aplicados duram +1 turno",
      trigger: "on_debuff_apply",
      effects: [{
        type: "extend_debuff",
        target: "enemies",
        value: 1
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Corrente Paralisante",
    rarity: "epic",
    description: "Corrente que paralisa inimigos",
    equipableType: "role",
    equipableTarget: "control",
    bonusHp: 60,
    bonusAttack: 50,
    bonusDefense: 40,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "paralyze_chance",
      name: "Paralisia",
      description: "Ataques têm 15% de chance de paralisar por 1 turno",
      trigger: "on_attack",
      effects: [{
        type: "apply_status",
        target: "target",
        status: "paralyzed",
        duration: 1,
        chance: 15
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  // ============================================
  // ✨ EQUIPAMENTOS DE CLASSE - SUPPORT
  // (Passiva opcional)
  // ============================================

  {
    name: "Banner de Batalha",
    rarity: "epic",
    description: "Banner que inspira aliados",
    equipableType: "role",
    equipableTarget: "support",
    bonusHp: 90,
    bonusAttack: 40,
    bonusDefense: 60,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "inspire_allies",
      name: "Inspirar Aliados",
      description: "Início de cada turno, aliados ganham +10% ATK por 1 turno",
      trigger: "on_turn_start",
      effects: [{
        type: "stat_boost",
        target: "allies",
        stat: "attack",
        value: 10,
        duration: 1
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Tambor de Guerra",
    rarity: "rare",
    description: "Tambor que aumenta stats de aliados",
    equipableType: "role",
    equipableTarget: "support",
    bonusHp: 70,
    bonusAttack: 30,
    bonusDefense: 40,
    bonusSpeed: 30,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  // ============================================
  // 🌟 EQUIPAMENTOS UNIVERSAIS
  // (Passiva rara)
  // ============================================

  {
    name: "Anel do Destino",
    rarity: "mythic",
    description: "Anel místico que desafia o destino",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 100,
    bonusAttack: 80,
    bonusDefense: 80,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: {
      id: "cheat_death",
      name: "Trapacear a Morte",
      description: "10% de chance de ressuscitar ao morrer com 50% HP (1x por batalha)",
      trigger: "on_death",
      effects: [{
        type: "revive",
        target: "self",
        value: 50,
        chance: 10
      }]
    },
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Colar de Energia",
    rarity: "epic",
    description: "Colar que aumenta stats balanceados",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 80,
    bonusAttack: 50,
    bonusDefense: 50,
    bonusSpeed: 20,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Brincos de Prata",
    rarity: "rare",
    description: "Brincos que aumentam velocidade e crítico",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 0,
    bonusAttack: 40,
    bonusDefense: 0,
    bonusSpeed: 50,
    bonusCritChance: 10,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Botas do Vento",
    rarity: "uncommon",
    description: "Botas que aumentam velocidade",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 0,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusSpeed: 40,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },

  {
    name: "Luvas de Força",
    rarity: "uncommon",
    description: "Luvas que aumentam ataque",
    equipableType: "universal",
    equipableTarget: null,
    bonusHp: 0,
    bonusAttack: 50,
    bonusDefense: 0,
    bonusSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    passiveAbility: null,
    imageUrl: null,
    catalogManaged: true,
  },
];

/**
 * Valida se um equipamento pode ser equipado em um personagem
 */
export function canEquipItem(
  equipment: Equipment,
  characterName: string,
  characterRole: string
): boolean {
  switch (equipment.equipableType) {
    case "character":
      return equipment.equipableTarget === characterName;
    case "role":
      return equipment.equipableTarget === characterRole;
    case "universal":
      return true;
    default:
      return false;
  }
}

/**
 * Retorna descrição de quem pode equipar
 */
export function getEquipableDescription(equipment: Equipment): string {
  switch (equipment.equipableType) {
    case "character":
      return `Equipável: ${equipment.equipableTarget}`;
    case "role":
      return `Equipável: ${equipment.equipableTarget?.toUpperCase()}`;
    case "universal":
      return "Equipável: Todos";
    default:
      return "Equipável: Ninguém";
  }
}
