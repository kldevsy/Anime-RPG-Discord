import { z } from "zod";
import { characterRarities, characterRoles } from "../schema/index.ts";
import {
  DETERMINATION,
  CHAKRA_CONTROL,
  RESILIENCE,
  SPIRITUAL_PRESSURE,
  BATTLE_INSTINCT,
  SHARINGAN,
  THREE_SWORD_STYLE,
  WATER_BREATHING,
  SUPERHUMAN_STRENGTH,
  DEADLY_SENTENCING,
  IDLE_TRANSFIGURATION,
  RATIO_TECHNIQUE,
  CURSED_SPIRIT_MANIPULATION,
  MOON_BREATHING,
  ICE_MANIPULATION,
  FIGHTING_SPIRIT,
  POISON_MASTERY,
  SILK_MANIPULATION,
  INFINITY_CASTLE,
  DEMON_TRANSFORMATION,
  ETERNAL_MANGEKYO,
  GORO_GORO_NO_MI,
  THE_ONE,
  FULL_COUNTER,
  DEMON_MARK,
  ASSAULT_MODE,
} from "./passive-library.ts";

/**
 * Catálogo canônico e versionado de personagens iniciais.
 *
 * O seed é autoritativo para linhas com `catalogManaged = true`: ao executá-lo,
 * ele sincroniza os campos do catálogo. Personagens criados pelo comando
 * administrativo recebem `catalogManaged = false` e preservam seus valores locais,
 * mesmo se tiverem o mesmo anime e nome de uma entrada deste catálogo.
 * Linhas existentes antes desta distinção também começam como não gerenciadas,
 * para que o seed não sobrescreva configurações administrativas legadas.
 *
 * Exemplo completo:
 * `{ anime: "Meu Anime", name: "Meu Personagem", rarity: "rare", role: "dps", baseHp: 900,
 * baseAttack: 180, baseDefense: 100, baseSpeed: 110, passive: "Minha passiva",
 * imageUrl: "https://example.com/personagem.png" }`.
 *
 * Para adicionar um registro, inclua um objeto completo em `characterCatalog`:
 * `{ anime, name, rarity, role, baseHp, baseAttack, baseDefense, baseSpeed, passive, imageUrl }`.
 * Use uma raridade e função presentes nos enums abaixo, atributos inteiros não negativos e
 * uma URL HTTP(S) (ou omita `imageUrl`). Não repita a combinação de anime e nome: a validação
 * do módulo rejeita duplicatas antes que o catálogo seja consumido pelo seed ou modo em memória.
 * Não copie esta lista para outros módulos; importe `characterCatalog` deles.
 */
const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "imageUrl must use HTTP(S)");

// An empty value is convenient while creating a character in the catalog.
// Store it as undefined instead of making the entire catalog fail at startup.
const optionalImageUrlSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  httpUrlSchema.optional(),
);

const statusEffectSchema = z.object({
  type: z.enum([
    "burn",
    "shock",
    "freeze",
    "stun",
    "poison",
    "bleed",
    "shield",
    "attack_up",
    "attack_down",
    "defense_up",
    "defense_down",
    "speed_up",
    "speed_down",
  ]),
  chance: z.number().min(0).max(100),
  duration: z.number().int().positive(),
  value: z.number(),
});

export const characterUltimateSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  chargeRequired: z.number().int().positive(),
  chargeOnBasic: z.number().int().nonnegative(),
  chargeOnDamageTaken: z.number().int().nonnegative(),
  chargeOnCritical: z.number().int().nonnegative(),
  type: z.enum([
    "DAMAGE",
    "HEAL",
    "BUFF",
    "DEBUFF",
    "STUN",
    "DOT",
    "SHIELD",
    "AOE",
    "EXECUTE",
    "REVIVE",
  ]),
  targetType: z.enum([
    "single_enemy",
    "aoe_enemy",
    "single_ally",
    "aoe_ally",
    "self",
  ]),
  multiplier: z.number().nonnegative(),
  statusEffects: z.array(statusEffectSchema),
  conditionalRules: z
    .array(
      z.object({
        condition: z.string().trim().min(1),
        effect: z.string().trim().min(1),
      }),
    )
    .default([]),
});

export type CharacterUltimate = z.infer<typeof characterUltimateSchema>;

// Schema para passivas estruturadas
export const passiveEffectSchema = z.object({
  type: z.string(),
  value: z.number(),
  duration: z.number().optional(),
  statusType: z.string().optional(),
  chance: z.number().min(0).max(100).optional(),
  target: z.enum(["self", "attacker", "target", "allies", "enemies", "all", "random_enemy", "random_ally", "lowest_hp_ally", "lowest_hp_enemy"]).optional(),
});

export const passiveConditionSchema = z.object({
  type: z.string(),
  value: z.number().optional(),
  statusType: z.string().optional(),
  role: z.string().optional(),
});

export const passiveAbilitySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  trigger: z.string(),
  conditions: z.array(passiveConditionSchema).optional(),
  effects: z.array(passiveEffectSchema),
  maxActivationsPerBattle: z.number().int().positive().optional(),
  maxActivationsPerRound: z.number().int().positive().optional(),
  cooldownRounds: z.number().int().nonnegative().optional(),
  priority: z.number().int().optional(),
});

export type PassiveAbility = z.infer<typeof passiveAbilitySchema>;

export const characterCatalogEntrySchema = z.object({
  anime: z.string().trim().min(1),
  name: z.string().trim().min(1),
  rarity: z.enum(characterRarities),
  role: z.enum(characterRoles),
  baseHp: z.number().int().nonnegative(),
  baseAttack: z.number().int().nonnegative(),
  baseDefense: z.number().int().nonnegative(),
  baseSpeed: z.number().int().nonnegative(),
  passive: z.string(), // Mantém string para compatibilidade com descrição visual
  passiveAbility: passiveAbilitySchema.optional(), // Nova: passiva funcional
  imageUrl: optionalImageUrlSchema,
  ultimate: characterUltimateSchema,
});

export type CharacterCatalogEntry = z.infer<typeof characterCatalogEntrySchema>;

export const characterCatalogSchema = z
  .array(characterCatalogEntrySchema)
  .superRefine((entries, context) => {
    const seen = new Set<string>();
    entries.forEach((entry, index) => {
      const key = `${entry.anime.toLocaleLowerCase()}\u0000${entry.name.toLocaleLowerCase()}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          message: "anime + name must be unique",
          path: [index, "name"],
        });
      }
      seen.add(key);
    });
  });

export const characterCatalog: CharacterCatalogEntry[] =
  characterCatalogSchema.parse([
    {
      anime: "Naruto",
      name: "Naruto Uzumaki",
      rarity: "rare",
      role: "dps",
      baseHp: 920,
      baseAttack: 180,
      baseDefense: 105,
      baseSpeed: 118,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542300558273024161/file_00000000ea4c820e878efde9947d103f.png?ex=6a90bad3&is=6a8f6953&hm=506347a4c36b471500e501550e05a0e0124905225c4f0b3bf04b87879e99307b&",
      passive:
        "Determinação: recebe um pequeno bônus de ataque abaixo de 50% de HP.",
      passiveAbility: DETERMINATION,
      ultimate: {
        id: "naruto_rasengan",
        name: "Rasengan",
        description:
          "Uma esfera de chakra concentrado que perfura a defesa inimiga.",
        chargeRequired: 100,
        chargeOnBasic: 24,
        chargeOnDamageTaken: 10,
        chargeOnCritical: 8,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 3,
        statusEffects: [
          { type: "defense_down", chance: 70, duration: 2, value: 20 },
        ],
        conditionalRules: [
          {
            condition: "HP abaixo de 50%",
            effect: "multiplicador aumenta em 0,3",
          },
        ],
      },
    },
    {
      anime: "Naruto",
      name: "Sakura Haruno",
      rarity: "uncommon",
      role: "healer",
      baseHp: 880,
      baseAttack: 120,
      baseDefense: 115,
      baseSpeed: 100,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542302133620179063/file_00000000d6c4820ea072e274eda736f4.png?ex=6a90bc4b&is=6a8f6acb&hm=0b62c43c919d44a038090ce7a402ac8ff00e502fad2adb399a674efce222dd7f",
      passive: "Controle de chakra: cura aliada com menor HP.",
      passiveAbility: CHAKRA_CONTROL,
      ultimate: {
        id: "sakura_hundred_healings",
        name: "Força de Cem Selos",
        description:
          "Libera chakra acumulado para restaurar e proteger toda a equipe.",
        chargeRequired: 110,
        chargeOnBasic: 18,
        chargeOnDamageTaken: 16,
        chargeOnCritical: 0,
        type: "HEAL",
        targetType: "aoe_ally",
        multiplier: 2.2,
        statusEffects: [
          { type: "shield", chance: 100, duration: 2, value: 180 },
          { type: "defense_up", chance: 100, duration: 2, value: 20 },
        ],
        conditionalRules: [
          {
            condition: "Aliado abaixo de 35% de HP",
            effect: "prioriza a cura em área",
          },
        ],
      },
    },
    {
      anime: "One Piece",
      name: "Monkey D. Luffy",
      rarity: "epic",
      role: "tank",
      baseHp: 1250,
      baseAttack: 165,
      baseDefense: 135,
      baseSpeed: 96,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542301848269095032/file_00000000534c820ebbab3e2662196527.png?ex=6a90bc07&is=6a8f6a87&hm=d2fff6c47a1b466316931e18efc7aca1a7d5e907a8476e63535df443a63bd852",
      passive: "Resiliência: reduz o primeiro dano recebido em cada combate.",
      passiveAbility: RESILIENCE,
      ultimate: {
        id: "luffy_red_roc",
        name: "Gear Third: Gomu Gomu no Red Roc",
        description:
          "Um soco gigantesco em chamas que atinge todos os inimigos.",
        chargeRequired: 105,
        chargeOnBasic: 20,
        chargeOnDamageTaken: 18,
        chargeOnCritical: 4,
        type: "AOE",
        targetType: "aoe_enemy",
        multiplier: 2.05,
        statusEffects: [{ type: "burn", chance: 75, duration: 2, value: 55 }],
        conditionalRules: [
          { condition: "Após usar", effect: "velocidade reduzida por 1 turno" },
        ],
      },
    },
    {
      anime: "Bleach",
      name: "Ichigo Kurosaki",
      rarity: "legendary",
      role: "dps",
      baseHp: 1080,
      baseAttack: 230,
      baseDefense: 110,
      baseSpeed: 125,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542300801836384286/file_00000000f550820eaf36a021f8edac38.png?ex=6a90bb0d&is=6a8f698d&hm=dd733a63294ff4dc64333dedb8f9257bb7573095d36dce1c6e22ccb8b58f8c8b&",
      passive:
        "Pressão espiritual: ataques têm chance de causar dano adicional.",
      passiveAbility: SPIRITUAL_PRESSURE,
      ultimate: {
        id: "ichigo_getsuga",
        name: "Getsuga Tensho",
        description:
          "Uma lâmina de energia espiritual que corta um único alvo.",
        chargeRequired: 95,
        chargeOnBasic: 26,
        chargeOnDamageTaken: 8,
        chargeOnCritical: 10,
        type: "EXECUTE",
        targetType: "single_enemy",
        multiplier: 3.25,
        statusEffects: [{ type: "bleed", chance: 70, duration: 2, value: 65 }],
        conditionalRules: [
          {
            condition: "Alvo abaixo de 25% de HP",
            effect: "dano de execução é priorizado",
          },
        ],
      },
    },
    {
      anime: "Dragon Ball",
      name: "Goku",
      rarity: "mythic",
      role: "dps",
      baseHp: 1400,
      baseAttack: 280,
      baseDefense: 145,
      baseSpeed: 130,
      imageUrl:
        "https://i.imgur.com/4retA79.png",
      passive:
        "Instinto de batalha: ganha força ao sobreviver a um golpe crítico.",
      passiveAbility: BATTLE_INSTINCT,
      ultimate: {
        id: "goku_kamehameha",
        name: "Kamehameha",
        description:
          "Uma rajada colossal de ki que explode em toda a linha inimiga.",
        chargeRequired: 140,
        chargeOnBasic: 14,
        chargeOnDamageTaken: 8,
        chargeOnCritical: 5,
        type: "AOE",
        targetType: "aoe_enemy",
        multiplier: 3.1,
        statusEffects: [
          { type: "defense_down", chance: 60, duration: 2, value: 25 },
        ],
        conditionalRules: [
          {
            condition: "Carga alta",
            effect: "carrega lentamente em troca de dano explosivo em área",
          },
        ],
      },
    },
    {
      anime: "Naruto",
      name: "Sasuke Uchiha",
      rarity: "epic",
      role: "dps",
      baseHp: 1050,
      baseAttack: 220,
      baseDefense: 112,
      baseSpeed: 122,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1482939713664057506/1541512302736580658/file_000000005108820eb47bf843d683fb26.png?ex=6a907fb4&is=6a8f2e34&hm=bf81301688ee4a55a0a278142a7549ab90ec7fb6006c34f356b56c8096e6bce8&",
      passive: "Sharingan: aumenta chance de crítico e dano crítico",
      passiveAbility: SHARINGAN,
      ultimate: {
        id: "sasuke_kirin",
        name: "Kirin / Chidori",
        description: "Canaliza relâmpagos para paralisar e fulminar o inimigo.",
        chargeRequired: 105,
        chargeOnBasic: 22,
        chargeOnDamageTaken: 10,
        chargeOnCritical: 8,
        type: "STUN",
        targetType: "single_enemy",
        multiplier: 2.7,
        statusEffects: [
          { type: "shock", chance: 100, duration: 2, value: 60 },
          { type: "stun", chance: 70, duration: 1, value: 0 },
        ],
        conditionalRules: [
          {
            condition: "Alvo está em choque",
            effect: "atordoamento tem prioridade",
          },
        ],
      },
    },
    {
      anime: "One Piece",
      name: "Roronoa Zoro",
      rarity: "rare",
      role: "dps",
      baseHp: 1100,
      baseAttack: 195,
      baseDefense: 120,
      baseSpeed: 110,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1482939713664057506/1541512302178861216/file_00000000ccf0820ebd98e66f889802a4.png?ex=6a907fb4&is=6a8f2e34&hm=6b44559e0eae1e350b0323d0b63d0478242389c8b0e9053bb3b62d0fb72a7066&",
      passive: "Santoryu: ataques básicos podem causar sangramento",
      passiveAbility: THREE_SWORD_STYLE,
      ultimate: {
        id: "zoro_ichidai_sanzen",
        name: "Santoryu: Ichidai Sanzen Daisen Sekai",
        description: "Um corte de três espadas que atravessa a guarda do alvo.",
        chargeRequired: 115,
        chargeOnBasic: 21,
        chargeOnDamageTaken: 12,
        chargeOnCritical: 7,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 3.45,
        statusEffects: [{ type: "bleed", chance: 100, duration: 3, value: 70 }],
        conditionalRules: [
          {
            condition: "Após usar",
            effect: "velocidade reduzida por 1 turno pela recuperação",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Tanjiro Kamado",
      rarity: "uncommon",
      role: "dps",
      baseHp: 950,
      baseAttack: 160,
      baseDefense: 110,
      baseSpeed: 112,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542300800741539940/file_0000000062f4820e98cb248ffd8a582c.png?ex=6a90bb0d&is=6a8f698d&hm=2d8e6a2db7ca7786f85f8265164af4c3635cf4457988742ce53ee1d6a9438586&",
      passive: "Respiração da Água: aumenta velocidade e defesa",
      passiveAbility: WATER_BREATHING,
      ultimate: {
        id: "tanjiro_hinokami_kagura",
        name: "Hinokami Kagura",
        description:
          "Uma dança solar que incendeia todos os inimigos atingidos.",
        chargeRequired: 100,
        chargeOnBasic: 23,
        chargeOnDamageTaken: 11,
        chargeOnCritical: 7,
        type: "AOE",
        targetType: "aoe_enemy",
        multiplier: 2.15,
        statusEffects: [{ type: "burn", chance: 100, duration: 3, value: 65 }],
        conditionalRules: [
          {
            condition: "Após usar",
            effect: "recebe dano de recuo de 5% do HP máximo",
          },
        ],
      },
    },
    {
      anime: "Jujutsu Kaisen",
      name: "Yuji Itadori",
      rarity: "common",
      role: "dps",
      baseHp: 850,
      baseAttack: 140,
      baseDefense: 100,
      baseSpeed: 105,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542300801274351726/file_00000000e684820e9891b29b8290cb54.png?ex=6a90bb0d&is=6a8f698d&hm=c91d993f7b948c4a7dc41362993d81396849927761abe99f3c5eb89472783641&",
      passive: "Força Sobre-humana: ganha carga ao dar crítico",
      passiveAbility: SUPERHUMAN_STRENGTH,
      ultimate: {
        id: "yuji_black_flash",
        name: "Black Flash",
        description:
          "Um golpe de energia amaldiçoada sincronizado no instante perfeito.",
        chargeRequired: 85,
        chargeOnBasic: 28,
        chargeOnDamageTaken: 12,
        chargeOnCritical: 18,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 2.8,
        statusEffects: [
          { type: "attack_down", chance: 65, duration: 2, value: 15 },
        ],
        conditionalRules: [
          {
            condition: "Acerto crítico",
            effect: "recebe carga extra para encadear o próximo Black Flash",
          },
        ],
      },
    },
    {
      anime: "Jujutsu Kaisen",
      name: "Hiromi Higuruma",
      rarity: "mythic",
      role: "support",
      baseHp: 1100,
      baseAttack: 195,
      baseDefense: 140,
      baseSpeed: 115,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1542421455969718342/1542421630356168804/file_00000000dcac820ea8cd712eb81d4b85.png?ex=6a91d455&is=6a9082d5&hm=c6d4640a04b72a05744619b58bf6d53b87f7df1b093740af627e449fef7a245f&",
      passive: "Sentença Mortal: confisca ATK do atacante ao sofrer dano",
      passiveAbility: DEADLY_SENTENCING,
      ultimate: {
        id: "higuruma_deadly_sentencing",
        name: "Julgamento Mortal",
        description:
          "Invoca seu Domínio de Expansão que confisca as técnicas do alvo e julga seus crimes.",
        chargeRequired: 100,
        chargeOnBasic: 25,
        chargeOnDamageTaken: 15,
        chargeOnCritical: 20,
        type: "DEBUFF",
        targetType: "single_enemy",
        multiplier: 1.5,
        statusEffects: [
          { type: "stun", chance: 100, duration: 2, value: 0 },
          { type: "attack_down", chance: 100, duration: 3, value: 40 },
        ],
        conditionalRules: [
          {
            condition: "Alvo com menos de 30% HP",
            effect: "execução instantânea (remove do combate)",
          },
        ],
      },
    },
    {
      anime: "Jujutsu Kaisen",
      name: "Mahito",
      rarity: "mythic",
      role: "dps",
      baseHp: 1250,
      baseAttack: 220,
      baseDefense: 110,
      baseSpeed: 125,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1542421455969718342/1542421629832011776/file_00000000edec820e93ac0ef97e71cc81.png?ex=6a91d455&is=6a9082d5&hm=cd4a5b0a413fa8896c753f6dfb62a89927582fd623c64e500bd61983825051dc&",
      passive: "Transfiguração Ociosa: reduz HP máximo do inimigo permanentemente",
      passiveAbility: IDLE_TRANSFIGURATION,
      ultimate: {
        id: "mahito_idle_transfiguration",
        name: "Transfiguração Ociosa: Polimórfica",
        description:
          "Toca a alma do inimigo e a deforma brutalmente, causando dano massivo.",
        chargeRequired: 95,
        chargeOnBasic: 30,
        chargeOnDamageTaken: 18,
        chargeOnCritical: 22,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 3.5,
        statusEffects: [
          { type: "defense_down", chance: 100, duration: 2, value: 50 },
        ],
        conditionalRules: [
          {
            condition: "Alvo com HP máximo reduzido",
            effect: "dano aumenta em 50% por cada 10% de HP máximo perdido",
          },
        ],
      },
    },
    {
      anime: "Jujutsu Kaisen",
      name: "Kento Nanami",
      rarity: "epic",
      role: "dps",
      baseHp: 950,
      baseAttack: 175,
      baseDefense: 120,
      baseSpeed: 108,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1542421455969718342/1542421629206790215/file_00000000aafc820e97c798be6e686304.png?ex=6a91d455&is=6a9082d5&hm=b8d277bd4bccadec375982bd00fccf966888b67410e57a899a373dc8fa2560a8&",
      passive: "Técnica 7:3: críticos causam dano extra e ignoram defesa",
      passiveAbility: RATIO_TECHNIQUE,
      ultimate: {
        id: "nanami_black_flash",
        name: "Técnica 7:3: Black Flash",
        description:
          "Identifica o ponto fraco do inimigo e ataca com precisão letal.",
        chargeRequired: 80,
        chargeOnBasic: 32,
        chargeOnDamageTaken: 12,
        chargeOnCritical: 25,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 3.2,
        statusEffects: [
          { type: "stun", chance: 70, duration: 1, value: 0 },
        ],
        conditionalRules: [
          {
            condition: "Sempre",
            effect: "garante acerto crítico e ignora 50% da defesa total",
          },
        ],
      },
    },
    {
      anime: "Jujutsu Kaisen",
      name: "Suguru Geto",
      rarity: "legendary",
      role: "support",
      baseHp: 1050,
      baseAttack: 185,
      baseDefense: 135,
      baseSpeed: 112,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1542421455969718342/1542421628799950858/file_0000000009d8820e9a32e83493ac6495.png?ex=6a91d455&is=6a9082d5&hm=e60da0645ffae2b763fe84541378e23526b8b48dc81f2693bd2d77c480178be5&",
      passive: "Manipulação de Espíritos: ao matar, recupera HP e ganha carga",
      passiveAbility: CURSED_SPIRIT_MANIPULATION,
      ultimate: {
        id: "geto_uzumaki",
        name: "Uzumaki",
        description:
          "Combina múltiplos espíritos amaldiçoados em uma esfera massiva de energia.",
        chargeRequired: 90,
        chargeOnBasic: 28,
        chargeOnDamageTaken: 14,
        chargeOnCritical: 20,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 2.2,
        statusEffects: [
          { type: "poison", chance: 80, duration: 3, value: 30 },
          { type: "defense_down", chance: 80, duration: 2, value: 25 },
        ],
        conditionalRules: [
          {
            condition: "Por cada inimigo morto nesta batalha",
            effect: "dano aumenta em 15%",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Kokushibo",
      rarity: "mythic",
      role: "dps",
      baseHp: 1300,
      baseAttack: 230,
      baseDefense: 125,
      baseSpeed: 130,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1482939713664057506/1541613929178861648/file_00000000aaf0820eafffd6c359a9ebbf.png?ex=6a91871a&is=6a90359a&hm=d0b9a98434d343705f164adaa1cfa21f669ed03978060209a03d99105fbe21c7&",
      passive: "Respiração da Lua: sangramento e reduz velocidade ao acertar",
      passiveAbility: MOON_BREATHING,
      ultimate: {
        id: "kokushibo_moon_breathing",
        name: "Décima Sexta Forma: Luar Sobre Terra Solitária",
        description:
          "Desencadeia múltiplos cortes em forma de luas crescentes que dilaceram todos os inimigos.",
        chargeRequired: 95,
        chargeOnBasic: 30,
        chargeOnDamageTaken: 16,
        chargeOnCritical: 24,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 2.6,
        statusEffects: [
          { type: "bleed", chance: 100, duration: 3, value: 50 },
          { type: "speed_down", chance: 80, duration: 2, value: 30 },
        ],
        conditionalRules: [
          {
            condition: "Garante acerto crítico",
            effect: "cada inimigo afetado por sangramento sofre 20% mais dano",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Douma",
      rarity: "mythic",
      role: "support",
      baseHp: 1200,
      baseAttack: 200,
      baseDefense: 150,
      baseSpeed: 118,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542727699917705287/content.png?ex=6a9248a2&is=6a90f722&hm=a58d40f3b8b087862a8b11ae3804f80027a1ba22571fb26443f32320c86c63be",
      passive: "Criotécnica de Sangue: congela atacantes ao sofrer dano",
      passiveAbility: ICE_MANIPULATION,
      ultimate: {
        id: "douma_crystalline_divine_child",
        name: "Estátuas de Gelo: Criança Divina",
        description:
          "Cria múltiplas estátuas de gelo que congelam e drenam a vida dos inimigos.",
        chargeRequired: 100,
        chargeOnBasic: 26,
        chargeOnDamageTaken: 18,
        chargeOnCritical: 20,
        type: "DEBUFF",
        targetType: "aoe_enemy",
        multiplier: 1.8,
        statusEffects: [
          { type: "freeze", chance: 90, duration: 2, value: 0 },
          { type: "defense_down", chance: 100, duration: 3, value: 35 },
        ],
        conditionalRules: [
          {
            condition: "Recupera 10% do HP máximo por inimigo congelado",
            effect: "se congelar 3+ inimigos, ganha escudo de 20% do HP máximo",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Akaza",
      rarity: "mythic",
      role: "dps",
      baseHp: 1350,
      baseAttack: 240,
      baseDefense: 115,
      baseSpeed: 135,
      imageUrl:
        "https://cdn.discordapp.com/attachments/1482939713664057506/1541613928734531685/file_000000007cac820e839513ec2f6c5576.webp?ex=6a922fda&is=6a90de5a&hm=2cc3bfb18e7308993483b780862f0eda80285bc87b83c35dfd689a8346e52d84&",
      passive: "Espírito de Luta: ganha 2% ATK por cada 10% de HP perdido",
      passiveAbility: FIGHTING_SPIRIT,
      ultimate: {
        id: "akaza_annihilation_type",
        name: "Técnica Destrutiva: Tipo Aniquilação",
        description:
          "Uma sequência devastadora de socos que quebra a guarda do inimigo.",
        chargeRequired: 85,
        chargeOnBasic: 35,
        chargeOnDamageTaken: 20,
        chargeOnCritical: 28,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 3.8,
        statusEffects: [
          { type: "defense_down", chance: 100, duration: 2, value: 50 },
          { type: "stun", chance: 60, duration: 1, value: 0 },
        ],
        conditionalRules: [
          {
            condition: "Se próprio HP < 50%",
            effect: "dano aumenta em 40% e garante crítico",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Gyutaro",
      rarity: "legendary",
      role: "dps",
      baseHp: 1100,
      baseAttack: 195,
      baseDefense: 105,
      baseSpeed: 122,
      imageUrl:
        "https://cdn.discordapp.com/attachments/979267903989899264/1542728769603772547/content.png?ex=6a9249a1&is=6a90f821&hm=4c3a135bcc4723c097f56f5a4bfd4c8dca92fa73f307098fc36b72bdc42e2270",
      passive: "Mestre do Veneno: envenena frequentemente, veneno causa mais dano",
      passiveAbility: POISON_MASTERY,
      ultimate: {
        id: "gyutaro_rotating_circular_slashes",
        name: "Cortes Circulares Giratórios: Lâminas Venenosas",
        description:
          "Gira suas foices envenenadas criando um redemoinho letal de veneno.",
        chargeRequired: 88,
        chargeOnBasic: 32,
        chargeOnDamageTaken: 15,
        chargeOnCritical: 22,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 2.4,
        statusEffects: [
          { type: "poison", chance: 100, duration: 4, value: 60 },
          { type: "attack_down", chance: 70, duration: 2, value: 20 },
        ],
        conditionalRules: [
          {
            condition: "Inimigos envenenados",
            effect: "dano aumenta em 15% por cada inimigo envenenado",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Daki",
      rarity: "epic",
      role: "support",
      baseHp: 900,
      baseAttack: 165,
      baseDefense: 110,
      baseSpeed: 125,
      imageUrl:
        "https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/2/25/Daki_anime_design.png",
      passive: "Manipulação de Faixas: críticos reduzem velocidade de todos os inimigos",
      passiveAbility: SILK_MANIPULATION,
      ultimate: {
        id: "daki_eight_layered_obi_slash",
        name: "Corte de Obi de Oito Camadas",
        description:
          "Suas faixas se multiplicam e atacam todos os inimigos simultaneamente, diminuindo-os.",
        chargeRequired: 85,
        chargeOnBasic: 30,
        chargeOnDamageTaken: 14,
        chargeOnCritical: 24,
        type: "DEBUFF",
        targetType: "aoe_enemy",
        multiplier: 1.9,
        statusEffects: [
          { type: "speed_down", chance: 100, duration: 3, value: 35 },
          { type: "attack_down", chance: 80, duration: 2, value: 25 },
          { type: "bleed", chance: 70, duration: 3, value: 35 },
        ],
        conditionalRules: [
          {
            condition: "Por cada inimigo afetado",
            effect: "aliados ganham 10% de velocidade por 2 turnos",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Nakime",
      rarity: "legendary",
      role: "support",
      baseHp: 1000,
      baseAttack: 160,
      baseDefense: 145,
      baseSpeed: 105,
      imageUrl:
        "https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/f/f1/Nakime_anime_design.png",
      passive: "Castelo Infinito: aliados ganham 15 de carga por rodada",
      passiveAbility: INFINITY_CASTLE,
      ultimate: {
        id: "nakime_dimensional_shift",
        name: "Distorção Dimensional: Castelo Infinito",
        description:
          "Manipula o espaço ao seu redor, desorientando inimigos e fortalecendo aliados.",
        chargeRequired: 90,
        chargeOnBasic: 25,
        chargeOnDamageTaken: 16,
        chargeOnCritical: 20,
        type: "BUFF",
        targetType: "aoe_ally",
        multiplier: 0.8,
        statusEffects: [
          { type: "attack_up", chance: 100, duration: 3, value: 30 },
          { type: "defense_up", chance: 100, duration: 3, value: 30 },
          { type: "speed_up", chance: 100, duration: 3, value: 20 },
        ],
        conditionalRules: [
          {
            condition: "Simultaneamente",
            effect: "todos os inimigos ficam atordoados por 1 turno e perdem 20 de carga",
          },
        ],
      },
    },
    {
      anime: "Demon Slayer",
      name: "Nezuko Kamado",
      rarity: "mythic",
      role: "dps",
      baseHp: 1250,
      baseAttack: 215,
      baseDefense: 120,
      baseSpeed: 128,
      imageUrl:
        "https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/a/a5/Nezuko_anime_design.png",
      passive: "Transformação Demoníaca: abaixo de 40% HP entra em modo berserker",
      passiveAbility: DEMON_TRANSFORMATION,
      ultimate: {
        id: "nezuko_exploding_blood",
        name: "Técnica Demoníaca: Sangue Explosivo",
        description:
          "Inflama seu sangue demoníaco causando uma explosão devastadora que queima todos os inimigos.",
        chargeRequired: 92,
        chargeOnBasic: 33,
        chargeOnDamageTaken: 18,
        chargeOnCritical: 26,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 3.0,
        statusEffects: [
          { type: "burn", chance: 100, duration: 4, value: 50 },
          { type: "defense_down", chance: 90, duration: 2, value: 30 },
        ],
        conditionalRules: [
          {
            condition: "Se em modo berserker (HP < 40%)",
            effect: "dano aumenta em 50% e queima ignora 30% da defesa",
          },
        ],
      },
    },
    {
      anime: "Naruto",
      name: "Madara Uchiha",
      rarity: "legendary",
      role: "dps",
      baseHp: 1150,
      baseAttack: 230,
      baseDefense: 115,
      baseSpeed: 135,
      imageUrl:
        "https://static.wikia.nocookie.net/naruto/images/3/35/Madara_Uchiha.png",
      passive: "Mangekyō Sharingan Eterno: 30% de chance de ativar Susanoo com escudo e bônus de dano",
      passiveAbility: ETERNAL_MANGEKYO,
      ultimate: {
        id: "madara_perfect_susanoo",
        name: "Susanoo Perfeito: Majestic Destroyer Flame",
        description:
          "Invoca seu Susanoo Perfeito e libera uma onda de fogo devastadora que incinera tudo.",
        chargeRequired: 95,
        chargeOnBasic: 35,
        chargeOnDamageTaken: 16,
        chargeOnCritical: 28,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 3.2,
        statusEffects: [
          { type: "burn", chance: 100, duration: 4, value: 55 },
          { type: "attack_down", chance: 80, duration: 3, value: 30 },
        ],
        conditionalRules: [
          {
            condition: "Se Susanoo estiver ativo (passiva)",
            effect: "dano aumenta em 40% e penetra 40% da defesa inimiga",
          },
        ],
      },
    },
    {
      anime: "One Piece",
      name: "Enel",
      rarity: "legendary",
      role: "support",
      baseHp: 1050,
      baseAttack: 195,
      baseDefense: 125,
      baseSpeed: 145,
      imageUrl:
        "https://static.wikia.nocookie.net/onepiece/images/f/f3/Enel_Anime_Infobox.png",
      passive: "Goro Goro no Mi: 45% de chance de chocar e diminuir velocidade ao acertar",
      passiveAbility: GORO_GORO_NO_MI,
      ultimate: {
        id: "enel_raigo",
        name: "Raigo: Julgamento Divino",
        description:
          "Invoca uma tempestade elétrica massiva que paralisa e eletrocuta todos os inimigos.",
        chargeRequired: 90,
        chargeOnBasic: 28,
        chargeOnDamageTaken: 14,
        chargeOnCritical: 25,
        type: "DEBUFF",
        targetType: "aoe_enemy",
        multiplier: 2.3,
        statusEffects: [
          { type: "shock", chance: 100, duration: 4, value: 50 },
          { type: "stun", chance: 85, duration: 1, value: 0 },
          { type: "speed_down", chance: 100, duration: 3, value: 40 },
        ],
        conditionalRules: [
          {
            condition: "Inimigos já chocados",
            effect: "dano aumenta em 60% e stun dura 2 turnos ao invés de 1",
          },
        ],
      },
    },
    {
      anime: "Seven Deadly Sins",
      name: "Escanor",
      rarity: "mythic",
      role: "tank",
      baseHp: 1500,
      baseAttack: 205,
      baseDefense: 180,
      baseSpeed: 90,
      imageUrl:
        "https://static.wikia.nocookie.net/nanatsu-no-taizai/images/9/98/Escanor_anime_full_appearance.png",
      passive: "The One: ganha 5% ATK/DEF por rodada (máx 10x), 50%+ stacks = imune a debuffs",
      passiveAbility: THE_ONE,
      ultimate: {
        id: "escanor_cruel_sun",
        name: "Cruel Sun: Orgulho Supremo",
        description:
          "Cria um sol miniatura que incendeia todos os inimigos e fortalece Escanor com seu calor.",
        chargeRequired: 100,
        chargeOnBasic: 30,
        chargeOnDamageTaken: 20,
        chargeOnCritical: 22,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 2.8,
        statusEffects: [
          { type: "burn", chance: 100, duration: 5, value: 60 },
          { type: "defense_down", chance: 100, duration: 3, value: 35 },
        ],
        conditionalRules: [
          {
            condition: "Por cada stack de The One (máx 10)",
            effect: "dano aumenta em 8% e cura 10% do HP máximo ao lançar",
          },
        ],
      },
    },
    {
      anime: "Seven Deadly Sins",
      name: "Meliodas",
      rarity: "epic",
      role: "dps",
      baseHp: 950,
      baseAttack: 180,
      baseDefense: 105,
      baseSpeed: 130,
      imageUrl:
        "https://static.wikia.nocookie.net/nanatsu-no-taizai/images/c/c2/Meliodas_anime_full_appearance.png",
      passive: "Full Counter: 35% de chance de refletir 120% do dano recebido",
      passiveAbility: FULL_COUNTER,
      ultimate: {
        id: "meliodas_revenge_counter",
        name: "Revenge Counter",
        description:
          "Acumula o dano recebido e devolve multiplicado em um único golpe devastador.",
        chargeRequired: 80,
        chargeOnBasic: 28,
        chargeOnDamageTaken: 20,
        chargeOnCritical: 24,
        type: "DAMAGE",
        targetType: "single_enemy",
        multiplier: 3.5,
        statusEffects: [
          { type: "attack_down", chance: 70, duration: 2, value: 25 },
        ],
        conditionalRules: [
          {
            condition: "Por cada 10% de HP perdido",
            effect: "dano aumenta em 12% (máx 60%)",
          },
        ],
      },
    },
    {
      anime: "Seven Deadly Sins",
      name: "Meliodas (Marca Demoníaca)",
      rarity: "legendary",
      role: "support",
      baseHp: 1100,
      baseAttack: 210,
      baseDefense: 125,
      baseSpeed: 140,
      imageUrl:
        "https://static.wikia.nocookie.net/nanatsu-no-taizai/images/5/52/Demon_Mark_Meliodas_Full_Appearance.png",
      passive: "Marca Demoníaca: reduz cura inimiga stackável, ganha velocidade em 30%+ stacks",
      passiveAbility: DEMON_MARK,
      ultimate: {
        id: "meliodas_hellblaze",
        name: "Hellblaze: Chamas Negras do Inferno",
        description:
          "Libera chamas negras demoníacas que queimam todos os inimigos e anulam regeneração.",
        chargeRequired: 88,
        chargeOnBasic: 32,
        chargeOnDamageTaken: 17,
        chargeOnCritical: 26,
        type: "DEBUFF",
        targetType: "aoe_enemy",
        multiplier: 2.4,
        statusEffects: [
          { type: "burn", chance: 100, duration: 5, value: 55 },
          { type: "defense_down", chance: 90, duration: 3, value: 30 },
        ],
        conditionalRules: [
          {
            condition: "Inimigos afetados",
            effect: "não podem ser curados por 3 turnos e perdem 15 de carga de ultimate",
          },
        ],
      },
    },
    {
      anime: "Seven Deadly Sins",
      name: "Meliodas (Assault Mode)",
      rarity: "mythic",
      role: "dps",
      baseHp: 1300,
      baseAttack: 245,
      baseDefense: 110,
      baseSpeed: 145,
      imageUrl:
        "https://static.wikia.nocookie.net/nanatsu-no-taizai/images/8/8c/Assault_Mode_Meliodas_Anime.png",
      passive: "Assault Mode: ganha 2% ATK por 1% HP perdido, +50% crit abaixo de 30% HP",
      passiveAbility: ASSAULT_MODE,
      ultimate: {
        id: "meliodas_kami_chigiri",
        name: "Kami Chigiri: Corte Divino",
        description:
          "Libera todo o poder demoníaco em um ataque que dilacera a realidade, causando dano catastrófico.",
        chargeRequired: 100,
        chargeOnBasic: 38,
        chargeOnDamageTaken: 22,
        chargeOnCritical: 30,
        type: "DAMAGE",
        targetType: "aoe_enemy",
        multiplier: 3.8,
        statusEffects: [
          { type: "bleed", chance: 100, duration: 4, value: 70 },
          { type: "defense_down", chance: 100, duration: 3, value: 40 },
          { type: "attack_down", chance: 85, duration: 2, value: 30 },
        ],
        conditionalRules: [
          {
            condition: "Por cada 1% de HP perdido",
            effect: "dano aumenta em 1.5% e ignora 1% da defesa inimiga (máx 100%)",
          },
        ],
      },
    },
  ]);
