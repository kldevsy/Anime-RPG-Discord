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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      passive:
        "Determinação: recebe um pequeno bônus de ataque abaixo de 50% de HP.",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/1.png",
      passive: "Controle de chakra: cura aliada com menor HP.",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/2.png",
      passive: "Resiliência: reduz o primeiro dano recebido em cada combate.",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/3.png",
      passive:
        "Pressão espiritual: ataques têm chance de causar dano adicional.",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/4.png",
      passive:
        "Instinto de batalha: ganha força ao sobreviver a um golpe crítico.",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/5.png",
      passive: "Sharingan",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/6.png",
      passive: "Santoryu",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/7.png",
      passive: "Respiração da Água",
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
      imageUrl: "https://cdn.discordapp.com/embed/avatars/8.png",
      passive: "Força Sobre-humana",
    },
  ]);
