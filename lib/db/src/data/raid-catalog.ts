/**
 * Catálogo de Raids - Mapas e Bosses
 * 
 * Sistema cooperativo multiplayer onde até 4 jogadores enfrentam
 * waves de inimigos e bosses épicos para ganhar recompensas premium.
 */

export interface RaidWave {
  wave: number;
  enemies: Array<{
    name: string;
    role: "tank" | "dps" | "support" | "healer" | "control";
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    passive?: string;
    isElite?: boolean;
  }>;
  environmentEffect?: {
    type: "burn" | "poison" | "heal" | "buff" | "debuff";
    value: number;
    description: string;
  };
}

export interface RaidBoss {
  name: string;
  title: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  passive: string;
  phases: Array<{
    hpThreshold: number; // percentage
    effect: string;
    addsToSpawn?: number;
  }>;
  ultimate: {
    name: string;
    description: string;
    multiplier: number;
    cooldown: number;
    effects: Array<{
      type: string;
      value: number;
      duration?: number;
    }>;
  };
}

export interface RaidMap {
  id: string;
  name: string;
  description: string;
  theme: string;
  minLevel: number;
  recommendedPower: number;
  availableDifficulties: Array<"normal" | "hard" | "nightmare">;
  estimatedTime: string;
  imageUrl?: string;
  waves: RaidWave[];
  boss: RaidBoss;
  baseRewards: {
    normal: {
      gold: [number, number];
      gems: [number, number];
      masteryXp: [number, number];
      tickets: [number, number];
    };
    hard: {
      gold: [number, number];
      gems: [number, number];
      masteryXp: [number, number];
      tickets: [number, number];
    };
    nightmare: {
      gold: [number, number];
      gems: [number, number];
      masteryXp: [number, number];
      tickets: [number, number];
    };
  };
  specialDrops: Array<{
    equipmentName: string;
    rarity: string;
    dropChance: number;
  }>;
  lootBoxDrops: {
    normal: Array<{ type: string; chance: number }>;
    hard: Array<{ type: string; chance: number }>;
    nightmare: Array<{ type: string; chance: number }>;
  };
}

/**
 * ========================================
 * RAID 1: TORRE DO ESQUECIMENTO
 * ========================================
 */
export const FORGOTTEN_TOWER: RaidMap = {
  id: "forgotten_tower",
  name: "Torre do Esquecimento",
  description: "Uma torre misteriosa que se ergue nas sombras, habitada por guardiões eternos que protegem segredos há muito esquecidos.",
  theme: "Místico/Sombrio",
  minLevel: 30,
  recommendedPower: 3500,
  availableDifficulties: ["normal", "hard", "nightmare"],
  estimatedTime: "15-20 min",
  imageUrl: "https://cdn.discordapp.com/attachments/979267903989899264/1542300558273024161/forgotten_tower.png",
  
  waves: [
    {
      wave: 1,
      enemies: [
        {
          name: "Sentinela das Sombras",
          role: "dps",
          hp: 800,
          attack: 150,
          defense: 80,
          speed: 110,
          passive: "Ataque nas sombras: +20% de chance de crítico",
        },
        {
          name: "Arqueiro Fantasma",
          role: "dps",
          hp: 650,
          attack: 170,
          defense: 60,
          speed: 130,
        },
        {
          name: "Guardião Menor",
          role: "tank",
          hp: 1000,
          attack: 120,
          defense: 110,
          speed: 85,
        },
      ],
    },
    {
      wave: 2,
      enemies: [
        {
          name: "Paladino Corrompido",
          role: "tank",
          hp: 1400,
          attack: 140,
          defense: 130,
          speed: 90,
          isElite: true,
          passive: "Escudo sagrado: reduz 20% de dano recebido",
        },
        {
          name: "Clérigo Sombrio",
          role: "healer",
          hp: 900,
          attack: 110,
          defense: 85,
          speed: 105,
          isElite: true,
          passive: "Cura profana: recupera 150 HP aliado com menos HP todo turno",
        },
      ],
    },
    {
      wave: 3,
      enemies: [
        {
          name: "Cavaleiro das Trevas",
          role: "dps",
          hp: 950,
          attack: 190,
          defense: 95,
          speed: 120,
        },
        {
          name: "Mago Esquecido",
          role: "control",
          hp: 800,
          attack: 180,
          defense: 70,
          speed: 115,
          passive: "Raio arcano: 30% chance de aplicar stun 1 turno",
        },
        {
          name: "Berserker Espectral",
          role: "dps",
          hp: 1100,
          attack: 200,
          defense: 80,
          speed: 125,
        },
        {
          name: "Necromante",
          role: "support",
          hp: 750,
          attack: 140,
          defense: 75,
          speed: 100,
        },
      ],
    },
    {
      wave: 4,
      enemies: [
        {
          name: "Golem Guardião",
          role: "tank",
          hp: 2200,
          attack: 180,
          defense: 160,
          speed: 70,
          isElite: true,
          passive: "Pele de pedra: imune a críticos, -50% dano de ataques básicos",
        },
      ],
      environmentEffect: {
        type: "debuff",
        value: 15,
        description: "Aura da torre: -15% velocidade para todos os jogadores",
      },
    },
  ],
  
  boss: {
    name: "Guardião Eterno",
    title: "Protetor da Torre Esquecida",
    hp: 8000,
    attack: 280,
    defense: 200,
    speed: 140,
    passive: "Essência Antiga: A cada 25% HP perdido, invoca 2 Sentinelas das Sombras como adds",
    phases: [
      {
        hpThreshold: 75,
        effect: "Entra em modo defensivo: +30% DEF, -20% ATK",
        addsToSpawn: 2,
      },
      {
        hpThreshold: 50,
        effect: "Recupera 1000 HP e remove todos os debuffs",
      },
      {
        hpThreshold: 25,
        effect: "Enrage: +50% ATK, +30 SPD, ignora 50% da defesa dos jogadores",
        addsToSpawn: 3,
      },
    ],
    ultimate: {
      name: "Julgamento Final",
      description: "O guardião canaliza a essência da torre para julgar todos os invasores",
      multiplier: 4.0,
      cooldown: 5,
      effects: [
        { type: "damage_aoe", value: 4.0 },
        { type: "stun", value: 2, duration: 2 },
        { type: "defense_down", value: 30, duration: 3 },
      ],
    },
  },
  
  baseRewards: {
    normal: {
      gold: [1000, 2000],
      gems: [100, 200],
      masteryXp: [100, 200],
      tickets: [10, 20],
    },
    hard: {
      gold: [2500, 4000],
      gems: [200, 400],
      masteryXp: [300, 500],
      tickets: [25, 40],
    },
    nightmare: {
      gold: [5000, 8000],
      gems: [500, 1000],
      masteryXp: [800, 1500],
      tickets: [50, 80],
    },
  },
  
  specialDrops: [
    {
      equipmentName: "Espada do Guardião",
      rarity: "legendary",
      dropChance: 8,
    },
    {
      equipmentName: "Armadura Etérea",
      rarity: "epic",
      dropChance: 15,
    },
    {
      equipmentName: "Amuleto da Torre",
      rarity: "rare",
      dropChance: 25,
    },
  ],
  
  lootBoxDrops: {
    normal: [
      { type: "basic", chance: 40 },
    ],
    hard: [
      { type: "advanced", chance: 60 },
      { type: "epic", chance: 20 },
    ],
    nightmare: [
      { type: "epic", chance: 50 },
      { type: "legendary", chance: 30 },
      { type: "mythic", chance: 10 },
    ],
  },
};

/**
 * ========================================
 * RAID 2: CAVERNA DO CAOS
 * ========================================
 */
export const CHAOS_CAVERN: RaidMap = {
  id: "chaos_cavern",
  name: "Caverna do Caos",
  description: "Uma caverna de lava habitada por demônios e criaturas do caos. O calor extremo queima qualquer um que ouse entrar.",
  theme: "Fogo/Demoníaco",
  minLevel: 40,
  recommendedPower: 6000,
  availableDifficulties: ["hard", "nightmare"],
  estimatedTime: "20-25 min",
  
  waves: [
    {
      wave: 1,
      enemies: [
        {
          name: "Imp Flamejante",
          role: "dps",
          hp: 900,
          attack: 180,
          defense: 75,
          speed: 135,
          passive: "Toque ardente: aplica burn (30 dano/turno) ao atacar",
        },
        {
          name: "Diabrete",
          role: "dps",
          hp: 850,
          attack: 190,
          defense: 70,
          speed: 140,
        },
        {
          name: "Cão Infernal",
          role: "dps",
          hp: 1000,
          attack: 200,
          defense: 80,
          speed: 130,
        },
        {
          name: "Feiticeiro de Lava",
          role: "control",
          hp: 800,
          attack: 170,
          defense: 65,
          speed: 120,
        },
      ],
      environmentEffect: {
        type: "burn",
        value: 40,
        description: "Calor da lava: todos jogadores sofrem 40 de dano de burn todo turno",
      },
    },
    {
      wave: 2,
      enemies: [
        {
          name: "Demônio Guerreiro",
          role: "tank",
          hp: 1800,
          attack: 220,
          defense: 140,
          speed: 100,
          isElite: true,
        },
        {
          name: "Arqui-Diabrete",
          role: "dps",
          hp: 1200,
          attack: 240,
          defense: 90,
          speed: 150,
          isElite: true,
          passive: "Fúria demoníaca: +30% ATK quando < 50% HP",
        },
        {
          name: "Xamã das Chamas",
          role: "healer",
          hp: 1000,
          attack: 150,
          defense: 85,
          speed: 110,
          isElite: true,
        },
      ],
    },
    {
      wave: 3,
      enemies: [
        {
          name: "Gêmeo das Chamas",
          role: "dps",
          hp: 1500,
          attack: 260,
          defense: 100,
          speed: 140,
          isElite: true,
          passive: "Vínculo gêmeo: se o outro morrer, ganha +100% ATK e +50 SPD",
        },
        {
          name: "Gêmeo das Sombras",
          role: "control",
          hp: 1500,
          attack: 240,
          defense: 110,
          speed: 135,
          isElite: true,
          passive: "Vínculo gêmeo: se o outro morrer, ganha +100% ATK e +50 SPD",
        },
      ],
      environmentEffect: {
        type: "burn",
        value: 60,
        description: "Calor EXTREMO: todos jogadores sofrem 60 de dano de burn todo turno",
      },
    },
    {
      wave: 4,
      enemies: [
        {
          name: "Behemoth de Lava",
          role: "tank",
          hp: 2500,
          attack: 250,
          defense: 180,
          speed: 80,
          isElite: true,
        },
        {
          name: "Salamandra Gigante",
          role: "dps",
          hp: 1400,
          attack: 280,
          defense: 90,
          speed: 145,
        },
        {
          name: "Cultista do Caos",
          role: "support",
          hp: 900,
          attack: 160,
          defense: 80,
          speed: 115,
        },
        {
          name: "Elemental de Fogo",
          role: "dps",
          hp: 1100,
          attack: 270,
          defense: 60,
          speed: 155,
          passive: "Forma de chamas: imune a burn, +50% dano de ataques de fogo",
        },
        {
          name: "Guardião Demoníaco",
          role: "tank",
          hp: 1900,
          attack: 230,
          defense: 160,
          speed: 95,
        },
      ],
      environmentEffect: {
        type: "burn",
        value: 80,
        description: "Núcleo de lava: todos jogadores sofrem 80 de dano de burn todo turno",
      },
    },
  ],
  
  boss: {
    name: "Senhor do Caos",
    title: "Rei dos Demônios de Lava",
    hp: 12000,
    attack: 320,
    defense: 180,
    speed: 150,
    passive: "Aura Infernal: Aplica burn (60 dano/turno) em TODOS no início de cada turno. Imune a burn e debuffs de fogo.",
    phases: [
      {
        hpThreshold: 60,
        effect: "Invoca 2 Imps Flamejantes e 1 Feiticeiro de Lava",
        addsToSpawn: 3,
      },
      {
        hpThreshold: 30,
        effect: "Entra em Forma Verdadeira: +50% ATK, +30 SPD, Aura Infernal causa 100 dano/turno",
      },
      {
        hpThreshold: 10,
        effect: "Enrage Final: +100% ATK, ignora DEF, ataques causam burn permanente",
      },
    ],
    ultimate: {
      name: "Explosão Caótica",
      description: "O Senhor do Caos libera todo seu poder em uma explosão devastadora de fogo e caos",
      multiplier: 5.0,
      cooldown: 4,
      effects: [
        { type: "damage_aoe", value: 5.0 },
        { type: "burn", value: 100, duration: 4 },
        { type: "attack_down", value: 40, duration: 3 },
        { type: "defense_down", value: 40, duration: 3 },
      ],
    },
  },
  
  baseRewards: {
    normal: {
      gold: [0, 0],
      gems: [0, 0],
      masteryXp: [0, 0],
      tickets: [0, 0],
    },
    hard: {
      gold: [3000, 5000],
      gems: [300, 500],
      masteryXp: [400, 700],
      tickets: [30, 50],
    },
    nightmare: {
      gold: [6000, 10000],
      gems: [700, 1200],
      masteryXp: [1000, 2000],
      tickets: [60, 100],
    },
  },
  
  specialDrops: [
    {
      equipmentName: "Colar do Caos",
      rarity: "mythic",
      dropChance: 5,
    },
    {
      equipmentName: "Botas Flamejantes",
      rarity: "legendary",
      dropChance: 12,
    },
    {
      equipmentName: "Escudo Ígneo",
      rarity: "epic",
      dropChance: 20,
    },
  ],
  
  lootBoxDrops: {
    normal: [],
    hard: [
      { type: "epic", chance: 100 }, // garantido 2x
      { type: "legendary", chance: 40 },
    ],
    nightmare: [
      { type: "epic", chance: 100 }, // garantido 2x
      { type: "legendary", chance: 80 },
      { type: "mythic", chance: 25 },
    ],
  },
};

/**
 * ========================================
 * RAID 3: SANTUÁRIO CELESTIAL
 * ========================================
 */
export const CELESTIAL_SANCTUARY: RaidMap = {
  id: "celestial_sanctuary",
  name: "Santuário Celestial",
  description: "Um templo flutuante nas nuvens, lar de anjos corrompidos e guardiões celestiais. A luz divina brilha, mas esconde trevas profundas.",
  theme: "Celestial/Divino",
  minLevel: 50,
  recommendedPower: 9000,
  availableDifficulties: ["nightmare"],
  estimatedTime: "30-40 min",
  
  waves: [
    {
      wave: 1,
      enemies: [
        {
          name: "Anjo Menor",
          role: "healer",
          hp: 1000,
          attack: 160,
          defense: 100,
          speed: 130,
          passive: "Luz curativa: cura 100 HP aliado aleatório todo turno",
        },
        {
          name: "Querubim",
          role: "support",
          hp: 900,
          attack: 150,
          defense: 95,
          speed: 140,
        },
        {
          name: "Guardião Alado",
          role: "dps",
          hp: 1100,
          attack: 210,
          defense: 105,
          speed: 145,
        },
      ],
    },
    {
      wave: 2,
      enemies: [
        {
          name: "Paladino Celestial",
          role: "tank",
          hp: 2200,
          attack: 200,
          defense: 170,
          speed: 110,
          isElite: true,
          passive: "Escudo divino: começa com shield 500, regenera 100 shield/turno",
        },
        {
          name: "Sacerdotisa da Luz",
          role: "healer",
          hp: 1300,
          attack: 170,
          defense: 110,
          speed: 125,
          isElite: true,
          passive: "Bênção divina: cura 200 HP em todos aliados a cada 2 turnos",
        },
        {
          name: "Executor Angelical",
          role: "dps",
          hp: 1400,
          attack: 270,
          defense: 100,
          speed: 160,
          isElite: true,
        },
        {
          name: "Templário",
          role: "control",
          hp: 1200,
          attack: 190,
          defense: 130,
          speed: 115,
          isElite: true,
        },
      ],
    },
    {
      wave: 3,
      enemies: [
        {
          name: "Arcanjo",
          role: "dps",
          hp: 1800,
          attack: 300,
          defense: 120,
          speed: 170,
          isElite: true,
          passive: "Golpe divino: críticos curam 50% do dano como HP",
        },
        {
          name: "Serafim",
          role: "support",
          hp: 1500,
          attack: 220,
          defense: 140,
          speed: 150,
          isElite: true,
          passive: "Aura celestial: +20% ATK e DEF para todos aliados",
        },
      ],
    },
    {
      wave: 4,
      enemies: [
        {
          name: "Serafim Corrompido",
          role: "dps",
          hp: 2500,
          attack: 340,
          defense: 140,
          speed: 165,
          isElite: true,
          passive: "Luz e trevas: alterna entre +50% ATK (turno ímpar) e +50% DEF (turno par)",
        },
      ],
      environmentEffect: {
        type: "heal",
        value: 150,
        description: "Luz divina residual: todos inimigos recuperam 150 HP por turno",
      },
    },
    {
      wave: 5,
      enemies: [
        {
          name: "Guardião Celestial",
          role: "tank",
          hp: 2000,
          attack: 250,
          defense: 200,
          speed: 120,
        },
        {
          name: "Anjo Vingador",
          role: "dps",
          hp: 1600,
          attack: 310,
          defense: 110,
          speed: 175,
        },
        {
          name: "Porta-voz Divino",
          role: "support",
          hp: 1400,
          attack: 200,
          defense: 130,
          speed: 140,
        },
        {
          name: "Juiz Celestial",
          role: "control",
          hp: 1700,
          attack: 240,
          defense: 150,
          speed: 135,
        },
        {
          name: "Curandeiro Supremo",
          role: "healer",
          hp: 1500,
          attack: 180,
          defense: 140,
          speed: 145,
          passive: "Cura suprema: cura 300 HP em todos aliados a cada 2 turnos",
        },
        {
          name: "Protetor Alado",
          role: "tank",
          hp: 2300,
          attack: 230,
          defense: 190,
          speed: 115,
        },
      ],
    },
  ],
  
  boss: {
    name: "Arcanjo Caído",
    title: "Guardião Corrompido do Santuário",
    hp: 18000,
    attack: 380,
    defense: 220,
    speed: 170,
    passive: "Regeneração Divina: A cada 2 turnos, cura 500 HP e ganha shield 300. Imune a debuffs enquanto tiver shield.",
    phases: [
      {
        hpThreshold: 60,
        effect: "Libera Poder Angelical: +30% todos stats, invoca 2 Serafins",
        addsToSpawn: 2,
      },
      {
        hpThreshold: 40,
        effect: "Corrupção Completa: perde curas mas ganha +80% ATK e ataques aplicam curse",
      },
      {
        hpThreshold: 20,
        effect: "Enrage Final: +150% ATK, +50 SPD, ultimate a cada 3 turnos ao invés de 5",
      },
    ],
    ultimate: {
      name: "Juízo Divino",
      description: "O Arcanjo Caído invoca o julgamento celestial para punir os invasores",
      multiplier: 6.0,
      cooldown: 5,
      effects: [
        { type: "damage_single", value: 6.0 },
        { type: "execute_threshold", value: 20 }, // executa se < 20% HP
        { type: "stun_team", value: 1, duration: 1 },
        { type: "defense_down", value: 50, duration: 3 },
      ],
    },
  },
  
  baseRewards: {
    normal: {
      gold: [0, 0],
      gems: [0, 0],
      masteryXp: [0, 0],
      tickets: [0, 0],
    },
    hard: {
      gold: [0, 0],
      gems: [0, 0],
      masteryXp: [0, 0],
      tickets: [0, 0],
    },
    nightmare: {
      gold: [8000, 15000],
      gems: [1000, 2000],
      masteryXp: [1500, 3000],
      tickets: [80, 150],
    },
  },
  
  specialDrops: [
    {
      equipmentName: "Asa Celestial",
      rarity: "mythic",
      dropChance: 8,
    },
    {
      equipmentName: "Halo Corrompido",
      rarity: "legendary",
      dropChance: 15,
    },
    {
      equipmentName: "Anel Angelical",
      rarity: "epic",
      dropChance: 25,
    },
  ],
  
  lootBoxDrops: {
    normal: [],
    hard: [],
    nightmare: [
      { type: "legendary", chance: 100 }, // garantido 3x
      { type: "legendary", chance: 100 },
      { type: "legendary", chance: 100 },
      { type: "mythic", chance: 25 },
    ],
  },
};

/**
 * Catálogo completo de raids
 */
export const RAID_CATALOG: RaidMap[] = [
  FORGOTTEN_TOWER,
  CHAOS_CAVERN,
  CELESTIAL_SANCTUARY,
];

/**
 * Helper: buscar raid por ID
 */
export function getRaidById(id: string): RaidMap | undefined {
  return RAID_CATALOG.find((raid) => raid.id === id);
}

/**
 * Helper: listar raids disponíveis por nível
 */
export function getAvailableRaids(playerLevel: number): RaidMap[] {
  return RAID_CATALOG.filter((raid) => playerLevel >= raid.minLevel);
}
