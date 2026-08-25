import { z } from "zod";
import { characterRarities, characterRoles } from "../schema";

/**
 * Catálogo canônico e versionado de personagens iniciais.
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

export const characterCatalogEntrySchema = z.object({
  anime: z.string().trim().min(1),
  name: z.string().trim().min(1),
  rarity: z.enum(characterRarities),
  role: z.enum(characterRoles),
  baseHp: z.number().int().nonnegative(),
  baseAttack: z.number().int().nonnegative(),
  baseDefense: z.number().int().nonnegative(),
  baseSpeed: z.number().int().nonnegative(),
  passive: z.string(),
  imageUrl: httpUrlSchema.optional(),
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
      passive:
        "Determinação: recebe um pequeno bônus de ataque abaixo de 50% de HP.",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/35.png",
      passive: "Controle de chakra: cura aliada com menor HP.",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
      passive: "Resiliência: reduz o primeiro dano recebido em cada combate.",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
      passive:
        "Pressão espiritual: ataques têm chance de causar dano adicional.",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png",
      passive:
        "Instinto de batalha: ganha força ao sobreviver a um golpe crítico.",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
      passive: "Sharingan",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/212.png",
      passive: "Santoryu",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png",
      passive: "Respiração da Água",
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
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
      passive: "Força Sobre-humana",
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
  ]);
