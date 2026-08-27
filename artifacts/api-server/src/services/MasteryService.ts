/**
 * Sistema de Maestria (Mastery System)
 * 
 * Quando um jogador invoca um personagem que já possui, ao invés de ganhar duplicata,
 * o personagem ganha XP de Maestria. Ao subir de nível de maestria, os stats aumentam.
 * 
 * Níveis: 1 a 15
 * XP por nível: Progressão exponencial (100, 150, 225, 337, 505...)
 * Boost por nível: HP +3%, ATK +2.5%, DEF +2%, SPD +1%
 */

export const MAX_MASTERY_LEVEL = 15;
export const BASE_MASTERY_XP = 100; // XP necessário para nível 1 → 2
export const MASTERY_XP_MULTIPLIER = 1.5; // Cada nível requer 50% mais XP

/**
 * Calcula o XP necessário para atingir um determinado nível de maestria
 */
export function getMasteryXpRequired(currentLevel: number): number {
  if (currentLevel >= MAX_MASTERY_LEVEL) {
    return Infinity; // Já está no nível máximo
  }
  
  // Fórmula: baseXP * (multiplier ^ (level - 1))
  const xpRequired = Math.floor(BASE_MASTERY_XP * Math.pow(MASTERY_XP_MULTIPLIER, currentLevel - 1));
  return xpRequired;
}

/**
 * Calcula quantos níveis podem ser ganhos com determinado XP
 * Retorna: { newLevel, remainingXp, levelsGained }
 */
export function calculateMasteryGain(
  currentLevel: number,
  currentXp: number,
  xpToAdd: number
): {
  newLevel: number;
  remainingXp: number;
  levelsGained: number;
} {
  let level = currentLevel;
  let xp = currentXp + xpToAdd;
  let levelsGained = 0;

  while (level < MAX_MASTERY_LEVEL) {
    const xpRequired = getMasteryXpRequired(level);
    
    if (xp >= xpRequired) {
      xp -= xpRequired;
      level += 1;
      levelsGained += 1;
    } else {
      break;
    }
  }

  // Se atingiu o nível máximo, zera o XP
  if (level >= MAX_MASTERY_LEVEL) {
    xp = 0;
  }

  return {
    newLevel: level,
    remainingXp: xp,
    levelsGained,
  };
}

/**
 * Calcula o XP de maestria ganho ao obter duplicata
 * XP ganho depende da raridade do personagem:
 * - Common: 50 XP
 * - Rare: 100 XP  
 * - Epic: 200 XP
 * - Legendary: 400 XP
 * - Mythic: 800 XP
 */
export function getMasteryXpFromDuplicate(rarity: string): number {
  const xpTable: Record<string, number> = {
    common: 50,
    rare: 100,
    epic: 200,
    legendary: 400,
    mythic: 800,
  };

  return xpTable[rarity.toLowerCase()] || 50;
}

/**
 * Calcula o boost de stats baseado no nível de maestria
 * HP: +3% por nível
 * ATK: +2.5% por nível
 * DEF: +2% por nível
 * SPD: +1% por nível
 */
export function calculateMasteryBoost(masteryLevel: number): {
  hpBonus: number;
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
} {
  const levelsAboveBase = Math.max(0, masteryLevel - 1);

  return {
    hpBonus: levelsAboveBase * 3, // +3% por nível
    attackBonus: levelsAboveBase * 2.5, // +2.5% por nível
    defenseBonus: levelsAboveBase * 2, // +2% por nível
    speedBonus: levelsAboveBase * 1, // +1% por nível
  };
}

/**
 * Aplica o boost de maestria aos stats base de um personagem
 */
export function applyMasteryBoost(
  baseHp: number,
  baseAttack: number,
  baseDefense: number,
  baseSpeed: number,
  masteryLevel: number
): {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
} {
  const boost = calculateMasteryBoost(masteryLevel);

  return {
    hp: Math.floor(baseHp * (1 + boost.hpBonus / 100)),
    attack: Math.floor(baseAttack * (1 + boost.attackBonus / 100)),
    defense: Math.floor(baseDefense * (1 + boost.defenseBonus / 100)),
    speed: Math.floor(baseSpeed * (1 + boost.speedBonus / 100)),
  };
}

/**
 * Formata informações de maestria para display
 */
export function formatMasteryInfo(
  masteryLevel: number,
  masteryXp: number
): string {
  if (masteryLevel >= MAX_MASTERY_LEVEL) {
    return `⭐ Nível ${masteryLevel} (MAX)`;
  }

  const xpRequired = getMasteryXpRequired(masteryLevel);
  const progress = Math.floor((masteryXp / xpRequired) * 100);

  return `⭐ Nível ${masteryLevel} (${masteryXp}/${xpRequired} XP - ${progress}%)`;
}
