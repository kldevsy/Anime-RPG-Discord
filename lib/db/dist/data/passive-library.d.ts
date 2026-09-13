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
export declare const BERSERKER_RAGE: PassiveAbility;
export declare const CRITICAL_MASTER: PassiveAbility;
export declare const EXECUTIONER: PassiveAbility;
export declare const COMBO_MASTER: PassiveAbility;
export declare const BLOODLUST: PassiveAbility;
/**
 * PASSIVAS DEFENSIVAS - Proteção e sobrevivência
 */
export declare const IRON_WILL: PassiveAbility;
export declare const LAST_STAND: PassiveAbility;
export declare const GUARDIAN_SHIELD: PassiveAbility;
export declare const DAMAGE_REDUCTION: PassiveAbility;
export declare const THORNS: PassiveAbility;
export declare const COUNTER_STRIKE: PassiveAbility;
/**
 * PASSIVAS DE CURA E SUPORTE
 */
export declare const REGENERATION: PassiveAbility;
export declare const VAMPIRE: PassiveAbility;
export declare const GUARDIAN_ANGEL: PassiveAbility;
export declare const TEAM_HEAL: PassiveAbility;
export declare const PURIFY: PassiveAbility;
/**
 * PASSIVAS DE VELOCIDADE E MOBILIDADE
 */
export declare const SWIFT_STRIKE: PassiveAbility;
export declare const MOMENTUM: PassiveAbility;
export declare const FIRST_STRIKE: PassiveAbility;
/**
 * PASSIVAS DE ENERGIA E ULTIMATE
 */
export declare const ENERGY_BATTERY: PassiveAbility;
export declare const QUICK_CHARGE: PassiveAbility;
export declare const COOLDOWN_MASTER: PassiveAbility;
/**
 * PASSIVAS ESPECIAIS E ÚNICAS
 */
export declare const SHARINGAN: PassiveAbility;
export declare const BATTLE_INSTINCT: PassiveAbility;
export declare const CHAKRA_CONTROL: PassiveAbility;
export declare const RESILIENCE: PassiveAbility;
export declare const SPIRITUAL_PRESSURE: PassiveAbility;
export declare const DETERMINATION: PassiveAbility;
export declare const WATER_BREATHING: PassiveAbility;
export declare const SUPERHUMAN_STRENGTH: PassiveAbility;
export declare const THREE_SWORD_STYLE: PassiveAbility;
/**
 * PASSIVAS DE JUJUTSU KAISEN - TÉCNICAS AMALDIÇOADAS
 */
export declare const DEADLY_SENTENCING: PassiveAbility;
export declare const IDLE_TRANSFIGURATION: PassiveAbility;
export declare const RATIO_TECHNIQUE: PassiveAbility;
export declare const CURSED_SPIRIT_MANIPULATION: PassiveAbility;
/**
 * PASSIVAS DE DEMON SLAYER - LUAS SUPERIORES
 */
export declare const MOON_BREATHING: PassiveAbility;
export declare const ICE_MANIPULATION: PassiveAbility;
export declare const FIGHTING_SPIRIT: PassiveAbility;
export declare const POISON_MASTERY: PassiveAbility;
/**
 * PASSIVAS DE DEMON SLAYER - PERSONAGENS FEMININAS
 */
export declare const SILK_MANIPULATION: PassiveAbility;
export declare const INFINITY_CASTLE: PassiveAbility;
export declare const DEMON_TRANSFORMATION: PassiveAbility;
/**
 * PASSIVAS LENDÁRIAS - PERSONAGENS ICÔNICOS
 */
export declare const ETERNAL_MANGEKYO: PassiveAbility;
export declare const GORO_GORO_NO_MI: PassiveAbility;
export declare const THE_ONE: PassiveAbility;
/**
 * PASSIVAS DE MELIODAS - SEVEN DEADLY SINS
 */
export declare const FULL_COUNTER: PassiveAbility;
export declare const DEMON_MARK: PassiveAbility;
export declare const ASSAULT_MODE: PassiveAbility;
/**
 * PASSIVAS DE NARUTO - AKATSUKI
 */
export declare const RINNEGAN: PassiveAbility;
/**
 * PASSIVAS DE JUJUTSU KAISEN - FEITICEIROS ESPECIAIS
 */
export declare const COPY_TECHNIQUE: PassiveAbility;
export declare const RIKA_MANIFESTATION: PassiveAbility;
/**
 * PASSIVAS DE BLACK CLOVER
 */
export declare const ANTI_MAGIC: PassiveAbility;
/**
 * PASSIVAS DE JUJUTSU KAISEN - REI DAS MALDIÇÕES
 */
export declare const KING_OF_CURSES: PassiveAbility;
export declare const MAHORAGA_ADAPTATION: PassiveAbility;
/**
 * PASSIVAS DE JUJUTSU KAISEN - FEITICEIROS ESPECIAIS
 */
export declare const INFINITY: PassiveAbility;
/**
 * PASSIVAS DE NARUTO - UCHIHA CLAN
 */
export declare const MANGEKYO_SHARINGAN: PassiveAbility;
export declare const PERFECT_SUSANOO_PASSIVE: PassiveAbility;
/**
 * PASSIVAS DE BOSS E INIMIGOS ESPECIAIS
 */
export declare const ENRAGE: PassiveAbility;
export declare const PHASE_TRANSITION: PassiveAbility;
/**
 * ========================================
 * PASSIVAS DOS NOVOS PERSONAGENS
 * ========================================
 */
export declare const JASHIN_RITUAL: PassiveAbility;
export declare const HELLSING_IMMORTALITY: PassiveAbility;
export declare const BLOOD_MANIPULATION: PassiveAbility;
export declare const AOE_PUNISHMENT: PassiveAbility;
/**
 * ========================================
 * PASSIVAS DOS 3 NOVOS PERSONAGENS
 * ========================================
 */
export declare const MOON_CRESCENT_BLADE: PassiveAbility;
export declare const SERPENT_REBIRTH: PassiveAbility;
export declare const DARKNESS_VOID: PassiveAbility;
/**
 * ========================================
 * PASSIVAS DOS 6 NOVOS PERSONAGENS
 * ========================================
 */
export declare const SIX_PATHS_OF_PAIN: PassiveAbility;
export declare const ANCIENT_MAGIC_CIRCLE: PassiveAbility;
export declare const PUPPET_MASTER: PassiveAbility;
export declare const DEMON_BLOOD_THREADS: PassiveAbility;
export declare const FLAME_HASHIRA: PassiveAbility;
export declare const SAND_ARMOR: PassiveAbility;
export declare const PASSIVE_LIBRARY: Record<string, PassiveAbility>;
/**
 * Helper para obter passiva da biblioteca
 */
export declare function getPassiveById(id: string): PassiveAbility | undefined;
/**
 * Helper para criar variação de passiva existente
 */
export declare function createPassiveVariant(baseId: string, overrides: Partial<PassiveAbility>): PassiveAbility | undefined;
//# sourceMappingURL=passive-library.d.ts.map