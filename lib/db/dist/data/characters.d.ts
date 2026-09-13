import { z } from "zod";
export declare const characterUltimateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    chargeRequired: z.ZodNumber;
    chargeOnBasic: z.ZodNumber;
    chargeOnDamageTaken: z.ZodNumber;
    chargeOnCritical: z.ZodNumber;
    type: z.ZodEnum<["DAMAGE", "HEAL", "BUFF", "DEBUFF", "STUN", "DOT", "SHIELD", "AOE", "EXECUTE", "REVIVE"]>;
    targetType: z.ZodEnum<["single_enemy", "aoe_enemy", "single_ally", "aoe_ally", "self"]>;
    multiplier: z.ZodNumber;
    statusEffects: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["burn", "shock", "freeze", "stun", "poison", "bleed", "shield", "attack_up", "attack_down", "defense_up", "defense_down", "speed_up", "speed_down"]>;
        chance: z.ZodNumber;
        duration: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
        value: number;
        chance: number;
    }, {
        duration: number;
        type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
        value: number;
        chance: number;
    }>, "many">;
    conditionalRules: z.ZodDefault<z.ZodArray<z.ZodObject<{
        condition: z.ZodString;
        effect: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        condition: string;
        effect: string;
    }, {
        condition: string;
        effect: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    chargeRequired: number;
    chargeOnBasic: number;
    chargeOnDamageTaken: number;
    chargeOnCritical: number;
    type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
    targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
    multiplier: number;
    statusEffects: {
        duration: number;
        type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
        value: number;
        chance: number;
    }[];
    conditionalRules: {
        condition: string;
        effect: string;
    }[];
}, {
    id: string;
    name: string;
    description: string;
    chargeRequired: number;
    chargeOnBasic: number;
    chargeOnDamageTaken: number;
    chargeOnCritical: number;
    type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
    targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
    multiplier: number;
    statusEffects: {
        duration: number;
        type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
        value: number;
        chance: number;
    }[];
    conditionalRules?: {
        condition: string;
        effect: string;
    }[] | undefined;
}>;
export type CharacterUltimate = z.infer<typeof characterUltimateSchema>;
export declare const passiveEffectSchema: z.ZodObject<{
    type: z.ZodString;
    value: z.ZodNumber;
    duration: z.ZodOptional<z.ZodNumber>;
    statusType: z.ZodOptional<z.ZodString>;
    chance: z.ZodOptional<z.ZodNumber>;
    target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    value: number;
    duration?: number | undefined;
    chance?: number | undefined;
    statusType?: string | undefined;
    target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
}, {
    type: string;
    value: number;
    duration?: number | undefined;
    chance?: number | undefined;
    statusType?: string | undefined;
    target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
}>;
export declare const passiveConditionSchema: z.ZodObject<{
    type: z.ZodString;
    value: z.ZodOptional<z.ZodNumber>;
    statusType: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    role?: string | undefined;
    value?: number | undefined;
    statusType?: string | undefined;
}, {
    type: string;
    role?: string | undefined;
    value?: number | undefined;
    statusType?: string | undefined;
}>;
export declare const passiveAbilitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    trigger: z.ZodString;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        value: z.ZodOptional<z.ZodNumber>;
        statusType: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        role?: string | undefined;
        value?: number | undefined;
        statusType?: string | undefined;
    }, {
        type: string;
        role?: string | undefined;
        value?: number | undefined;
        statusType?: string | undefined;
    }>, "many">>;
    effects: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        value: z.ZodNumber;
        duration: z.ZodOptional<z.ZodNumber>;
        statusType: z.ZodOptional<z.ZodString>;
        chance: z.ZodOptional<z.ZodNumber>;
        target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }, {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }>, "many">;
    maxActivationsPerBattle: z.ZodOptional<z.ZodNumber>;
    maxActivationsPerRound: z.ZodOptional<z.ZodNumber>;
    cooldownRounds: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodOptional<z.ZodNumber>;
    stackCounter: z.ZodOptional<z.ZodNumber>;
    stackLimit: z.ZodOptional<z.ZodNumber>;
    stackEffect: z.ZodOptional<z.ZodObject<{
        type: z.ZodString;
        value: z.ZodNumber;
        duration: z.ZodOptional<z.ZodNumber>;
        statusType: z.ZodOptional<z.ZodString>;
        chance: z.ZodOptional<z.ZodNumber>;
        target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }, {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }>>;
    conditionalEffects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        value: z.ZodNumber;
        duration: z.ZodOptional<z.ZodNumber>;
        statusType: z.ZodOptional<z.ZodString>;
        chance: z.ZodOptional<z.ZodNumber>;
        target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }, {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    trigger: string;
    effects: {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }[];
    conditions?: {
        type: string;
        role?: string | undefined;
        value?: number | undefined;
        statusType?: string | undefined;
    }[] | undefined;
    maxActivationsPerBattle?: number | undefined;
    maxActivationsPerRound?: number | undefined;
    cooldownRounds?: number | undefined;
    priority?: number | undefined;
    stackCounter?: number | undefined;
    stackLimit?: number | undefined;
    stackEffect?: {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    } | undefined;
    conditionalEffects?: {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }[] | undefined;
}, {
    id: string;
    name: string;
    description: string;
    trigger: string;
    effects: {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }[];
    conditions?: {
        type: string;
        role?: string | undefined;
        value?: number | undefined;
        statusType?: string | undefined;
    }[] | undefined;
    maxActivationsPerBattle?: number | undefined;
    maxActivationsPerRound?: number | undefined;
    cooldownRounds?: number | undefined;
    priority?: number | undefined;
    stackCounter?: number | undefined;
    stackLimit?: number | undefined;
    stackEffect?: {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    } | undefined;
    conditionalEffects?: {
        type: string;
        value: number;
        duration?: number | undefined;
        chance?: number | undefined;
        statusType?: string | undefined;
        target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
    }[] | undefined;
}>;
export type PassiveAbility = z.infer<typeof passiveAbilitySchema>;
export declare const characterCatalogEntrySchema: z.ZodObject<{
    anime: z.ZodString;
    name: z.ZodString;
    rarity: z.ZodEnum<["common", "uncommon", "rare", "epic", "legendary", "mythic"]>;
    role: z.ZodEnum<["tank", "dps", "support", "healer", "control"]>;
    baseHp: z.ZodNumber;
    baseAttack: z.ZodNumber;
    baseDefense: z.ZodNumber;
    baseSpeed: z.ZodNumber;
    passive: z.ZodString;
    passiveAbility: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        trigger: z.ZodString;
        conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }, {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }>, "many">>;
        effects: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            chance: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }>, "many">;
        maxActivationsPerBattle: z.ZodOptional<z.ZodNumber>;
        maxActivationsPerRound: z.ZodOptional<z.ZodNumber>;
        cooldownRounds: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodOptional<z.ZodNumber>;
        stackCounter: z.ZodOptional<z.ZodNumber>;
        stackLimit: z.ZodOptional<z.ZodNumber>;
        stackEffect: z.ZodOptional<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            chance: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }>>;
        conditionalEffects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            chance: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    }>>;
    imageUrl: z.ZodEffects<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>, string | undefined, unknown>;
    ultimate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        chargeRequired: z.ZodNumber;
        chargeOnBasic: z.ZodNumber;
        chargeOnDamageTaken: z.ZodNumber;
        chargeOnCritical: z.ZodNumber;
        type: z.ZodEnum<["DAMAGE", "HEAL", "BUFF", "DEBUFF", "STUN", "DOT", "SHIELD", "AOE", "EXECUTE", "REVIVE"]>;
        targetType: z.ZodEnum<["single_enemy", "aoe_enemy", "single_ally", "aoe_ally", "self"]>;
        multiplier: z.ZodNumber;
        statusEffects: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["burn", "shock", "freeze", "stun", "poison", "bleed", "shield", "attack_up", "attack_down", "defense_up", "defense_down", "speed_up", "speed_down"]>;
            chance: z.ZodNumber;
            duration: z.ZodNumber;
            value: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }, {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }>, "many">;
        conditionalRules: z.ZodDefault<z.ZodArray<z.ZodObject<{
            condition: z.ZodString;
            effect: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            condition: string;
            effect: string;
        }, {
            condition: string;
            effect: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules: {
            condition: string;
            effect: string;
        }[];
    }, {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules?: {
            condition: string;
            effect: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    role: "tank" | "dps" | "support" | "healer" | "control";
    name: string;
    anime: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    passive: string;
    ultimate: {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules: {
            condition: string;
            effect: string;
        }[];
    };
    imageUrl?: string | undefined;
    passiveAbility?: {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    } | undefined;
}, {
    role: "tank" | "dps" | "support" | "healer" | "control";
    name: string;
    anime: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    passive: string;
    ultimate: {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules?: {
            condition: string;
            effect: string;
        }[] | undefined;
    };
    imageUrl?: unknown;
    passiveAbility?: {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    } | undefined;
}>;
export type CharacterCatalogEntry = z.infer<typeof characterCatalogEntrySchema>;
export declare const characterCatalogSchema: z.ZodEffects<z.ZodArray<z.ZodObject<{
    anime: z.ZodString;
    name: z.ZodString;
    rarity: z.ZodEnum<["common", "uncommon", "rare", "epic", "legendary", "mythic"]>;
    role: z.ZodEnum<["tank", "dps", "support", "healer", "control"]>;
    baseHp: z.ZodNumber;
    baseAttack: z.ZodNumber;
    baseDefense: z.ZodNumber;
    baseSpeed: z.ZodNumber;
    passive: z.ZodString;
    passiveAbility: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        trigger: z.ZodString;
        conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }, {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }>, "many">>;
        effects: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            chance: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }>, "many">;
        maxActivationsPerBattle: z.ZodOptional<z.ZodNumber>;
        maxActivationsPerRound: z.ZodOptional<z.ZodNumber>;
        cooldownRounds: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodOptional<z.ZodNumber>;
        stackCounter: z.ZodOptional<z.ZodNumber>;
        stackLimit: z.ZodOptional<z.ZodNumber>;
        stackEffect: z.ZodOptional<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            chance: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }>>;
        conditionalEffects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
            statusType: z.ZodOptional<z.ZodString>;
            chance: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodEnum<["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }, {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    }>>;
    imageUrl: z.ZodEffects<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>, string | undefined, unknown>;
    ultimate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        chargeRequired: z.ZodNumber;
        chargeOnBasic: z.ZodNumber;
        chargeOnDamageTaken: z.ZodNumber;
        chargeOnCritical: z.ZodNumber;
        type: z.ZodEnum<["DAMAGE", "HEAL", "BUFF", "DEBUFF", "STUN", "DOT", "SHIELD", "AOE", "EXECUTE", "REVIVE"]>;
        targetType: z.ZodEnum<["single_enemy", "aoe_enemy", "single_ally", "aoe_ally", "self"]>;
        multiplier: z.ZodNumber;
        statusEffects: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["burn", "shock", "freeze", "stun", "poison", "bleed", "shield", "attack_up", "attack_down", "defense_up", "defense_down", "speed_up", "speed_down"]>;
            chance: z.ZodNumber;
            duration: z.ZodNumber;
            value: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }, {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }>, "many">;
        conditionalRules: z.ZodDefault<z.ZodArray<z.ZodObject<{
            condition: z.ZodString;
            effect: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            condition: string;
            effect: string;
        }, {
            condition: string;
            effect: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules: {
            condition: string;
            effect: string;
        }[];
    }, {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules?: {
            condition: string;
            effect: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    role: "tank" | "dps" | "support" | "healer" | "control";
    name: string;
    anime: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    passive: string;
    ultimate: {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules: {
            condition: string;
            effect: string;
        }[];
    };
    imageUrl?: string | undefined;
    passiveAbility?: {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    } | undefined;
}, {
    role: "tank" | "dps" | "support" | "healer" | "control";
    name: string;
    anime: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    passive: string;
    ultimate: {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules?: {
            condition: string;
            effect: string;
        }[] | undefined;
    };
    imageUrl?: unknown;
    passiveAbility?: {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    } | undefined;
}>, "many">, {
    role: "tank" | "dps" | "support" | "healer" | "control";
    name: string;
    anime: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    passive: string;
    ultimate: {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules: {
            condition: string;
            effect: string;
        }[];
    };
    imageUrl?: string | undefined;
    passiveAbility?: {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    } | undefined;
}[], {
    role: "tank" | "dps" | "support" | "healer" | "control";
    name: string;
    anime: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    passive: string;
    ultimate: {
        id: string;
        name: string;
        description: string;
        chargeRequired: number;
        chargeOnBasic: number;
        chargeOnDamageTaken: number;
        chargeOnCritical: number;
        type: "DAMAGE" | "HEAL" | "BUFF" | "DEBUFF" | "STUN" | "DOT" | "SHIELD" | "AOE" | "EXECUTE" | "REVIVE";
        targetType: "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";
        multiplier: number;
        statusEffects: {
            duration: number;
            type: "burn" | "shock" | "freeze" | "stun" | "poison" | "bleed" | "shield" | "attack_up" | "attack_down" | "defense_up" | "defense_down" | "speed_up" | "speed_down";
            value: number;
            chance: number;
        }[];
        conditionalRules?: {
            condition: string;
            effect: string;
        }[] | undefined;
    };
    imageUrl?: unknown;
    passiveAbility?: {
        id: string;
        name: string;
        description: string;
        trigger: string;
        effects: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[];
        conditions?: {
            type: string;
            role?: string | undefined;
            value?: number | undefined;
            statusType?: string | undefined;
        }[] | undefined;
        maxActivationsPerBattle?: number | undefined;
        maxActivationsPerRound?: number | undefined;
        cooldownRounds?: number | undefined;
        priority?: number | undefined;
        stackCounter?: number | undefined;
        stackLimit?: number | undefined;
        stackEffect?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        } | undefined;
        conditionalEffects?: {
            type: string;
            value: number;
            duration?: number | undefined;
            chance?: number | undefined;
            statusType?: string | undefined;
            target?: "self" | "attacker" | "target" | "allies" | "enemies" | "all" | "random_enemy" | "random_ally" | "lowest_hp_ally" | "lowest_hp_enemy" | undefined;
        }[] | undefined;
    } | undefined;
}[]>;
export declare const characterCatalog: CharacterCatalogEntry[];
//# sourceMappingURL=characters.d.ts.map