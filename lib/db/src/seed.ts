import { characters } from "./schema";
import { db, pool } from "./index";

const seedCharacters = [
  { anime: "Naruto", name: "Naruto Uzumaki", rarity: "rare" as const, role: "dps" as const, baseHp: 920, baseAttack: 180, baseDefense: 105, baseSpeed: 118, passive: "Determinação: recebe um pequeno bônus de ataque abaixo de 50% de HP." },
  { anime: "Naruto", name: "Sakura Haruno", rarity: "uncommon" as const, role: "healer" as const, baseHp: 880, baseAttack: 120, baseDefense: 115, baseSpeed: 100, passive: "Controle de chakra: cura aliada com menor HP." },
  { anime: "One Piece", name: "Monkey D. Luffy", rarity: "epic" as const, role: "tank" as const, baseHp: 1250, baseAttack: 165, baseDefense: 135, baseSpeed: 96, passive: "Resiliência: reduz o primeiro dano recebido em cada combate." },
  { anime: "Bleach", name: "Ichigo Kurosaki", rarity: "legendary" as const, role: "dps" as const, baseHp: 1080, baseAttack: 230, baseDefense: 110, baseSpeed: 125, passive: "Pressão espiritual: ataques têm chance de causar dano adicional." },
  { anime: "Dragon Ball", name: "Goku", rarity: "mythic" as const, role: "dps" as const, baseHp: 1400, baseAttack: 280, baseDefense: 145, baseSpeed: 130, passive: "Instinto de batalha: ganha força ao sobreviver a um golpe crítico." },
];

if (!db) throw new Error("DATABASE_URL must be set before running the seed.");

await db.insert(characters).values(seedCharacters).onConflictDoNothing();
await pool?.end();