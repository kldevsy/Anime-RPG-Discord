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
        hpThreshold: number;
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
        normal: Array<{
            type: string;
            chance: number;
        }>;
        hard: Array<{
            type: string;
            chance: number;
        }>;
        nightmare: Array<{
            type: string;
            chance: number;
        }>;
    };
}
/**
 * ========================================
 * RAID 1: TORRE DO ESQUECIMENTO
 * ========================================
 */
export declare const FORGOTTEN_TOWER: RaidMap;
/**
 * ========================================
 * RAID 2: CAVERNA DO CAOS
 * ========================================
 */
export declare const CHAOS_CAVERN: RaidMap;
/**
 * ========================================
 * RAID 3: SANTUÁRIO CELESTIAL
 * ========================================
 */
export declare const CELESTIAL_SANCTUARY: RaidMap;
/**
 * Catálogo completo de raids
 */
export declare const RAID_CATALOG: RaidMap[];
/**
 * Helper: buscar raid por ID
 */
export declare function getRaidById(id: string): RaidMap | undefined;
/**
 * Helper: listar raids disponíveis por nível
 */
export declare function getAvailableRaids(playerLevel: number): RaidMap[];
//# sourceMappingURL=raid-catalog.d.ts.map