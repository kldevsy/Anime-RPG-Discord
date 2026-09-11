/**
 * FormationService - Sistema de Formação e Counter/Weakness
 * 
 * Implementa:
 * - Posições táticas (Front/Mid/Back)
 * - Vantagens elementais
 * - Counters de papel (Role)
 * - Modificadores de dano
 */

export type ElementType = "fire" | "water" | "electric" | "earth" | "wind" | "light" | "dark" | "neutral";
export type PositionType = "front" | "mid" | "back";
export type RoleType = "dps" | "tank" | "suporte" | "controle";

// ===== TABELAS DE VANTAGENS =====

/**
 * Vantagens Elementais
 * 
 * Formato: [atacante][defensor] = modificador
 * 1.5 = 50% mais dano (vantagem)
 * 0.75 = 25% menos dano (desvantagem)
 * 1.0 = dano normal
 */
const ELEMENT_ADVANTAGE: Record<ElementType, Partial<Record<ElementType, number>>> = {
  fire: {
    water: 0.75,   // Fogo é fraco contra Água
    electric: 1.0,
    earth: 1.5,    // Fogo é forte contra Terra
    wind: 0.75,    // Vento apaga fogo
    light: 1.0,
    dark: 1.0,
  },
  water: {
    fire: 1.5,     // Água apaga Fogo
    electric: 0.75, // Água conduz Eletricidade (ruim para água)
    earth: 1.0,
    wind: 1.0,
    light: 1.0,
    dark: 1.0,
  },
  electric: {
    fire: 1.0,
    water: 1.5,    // Elétrico choca Água
    earth: 0.75,   // Terra aterra Elétrico
    wind: 1.5,     // Elétrico viaja por Vento
    light: 1.0,
    dark: 1.0,
  },
  earth: {
    fire: 0.75,    // Terra derrete com Fogo
    water: 1.5,    // Terra absorve Água
    electric: 1.5, // Terra aterra Elétrico
    wind: 0.75,    // Vento erode Terra
    light: 1.0,
    dark: 1.0,
  },
  wind: {
    fire: 1.5,     // Vento alimenta Fogo
    water: 1.0,
    electric: 0.75,
    earth: 1.5,    // Vento erode Terra
    light: 1.0,
    dark: 1.0,
  },
  light: {
    dark: 1.5,     // Luz banish Trevas
    fire: 1.0,
    water: 1.0,
    electric: 1.0,
    earth: 1.0,
    wind: 1.0,
  },
  dark: {
    light: 1.5,    // Trevas consomem Luz
    fire: 1.0,
    water: 1.0,
    electric: 1.0,
    earth: 1.0,
    wind: 1.0,
  },
  neutral: {},     // Neutral não tem vantagem/desvantagem
};

/**
 * Counter de Papéis (Role)
 * 
 * DPS > Suporte (mata rápido)
 * Suporte > Tank (cura supera dano do tank)
 * Tank > DPS (aguenta o dano)
 * Controle é neutro mas efetivo contra todos
 */
const ROLE_COUNTER: Record<RoleType, Partial<Record<RoleType, number>>> = {
  dps: {
    suporte: 1.25,  // DPS mata suporte rápido
    tank: 0.85,     // Tank aguenta DPS
    controle: 0.95,
  },
  tank: {
    dps: 1.25,      // Tank resiste DPS
    suporte: 0.85,  // Suporte cura mais que tank dano
    controle: 0.95,
  },
  suporte: {
    tank: 1.25,     // Cura supera dano do tank
    dps: 0.85,      // DPS mata suporte
    controle: 0.95,
  },
  controle: {
    dps: 1.1,       // Controle é bom contra todos
    tank: 1.1,
    suporte: 1.1,
  },
};

/**
 * Modificadores de Posição
 * 
 * Front: +10% dano causado, +20% dano recebido (linha de frente)
 * Mid: Balanceado (sem modificadores)
 * Back: +15% dano causado, -10% dano recebido (seguro atrás)
 */
const POSITION_MODIFIERS = {
  front: {
    damageDealt: 1.10,      // +10% dano
    damageTaken: 1.20,      // +20% dano recebido
    description: "Linha de Frente - Mais dano mas mais vulnerável",
  },
  mid: {
    damageDealt: 1.0,       // Neutro
    damageTaken: 1.0,       // Neutro
    description: "Meio Campo - Balanceado",
  },
  back: {
    damageDealt: 1.15,      // +15% dano
    damageTaken: 0.90,      // -10% dano recebido
    description: "Retaguarda - Seguro e eficiente",
  },
};

/**
 * Sinergia de Posição vs Posição
 * 
 * Atacar alvos na frente é mais fácil
 * Atacar alvos atrás é mais difícil
 */
const POSITION_VS_POSITION: Record<PositionType, Record<PositionType, number>> = {
  front: {
    front: 1.0,     // Frente vs Frente = normal
    mid: 0.95,      // Frente vs Mid = pouco mais difícil
    back: 0.85,     // Frente vs Back = bem mais difícil (muito longe)
  },
  mid: {
    front: 1.05,    // Mid vs Frente = fácil (alvo próximo)
    mid: 1.0,       // Mid vs Mid = normal
    back: 0.95,     // Mid vs Back = pouco mais difícil
  },
  back: {
    front: 1.10,    // Back vs Frente = muito fácil (alvo exposto)
    mid: 1.05,      // Back vs Mid = fácil
    back: 1.0,      // Back vs Back = normal
  },
};

// ===== FUNÇÕES DE CÁLCULO =====

export interface DamageModifiers {
  elementalAdvantage: number;
  roleCounter: number;
  attackerPosition: number;
  defenderPosition: number;
  positionVsPosition: number;
  total: number;
  description: string[];
}

/**
 * Calcula todos os modificadores de dano
 */
export function calculateDamageModifiers(
  attackerElement: ElementType,
  defenderElement: ElementType,
  attackerRole: RoleType,
  defenderRole: RoleType,
  attackerPosition: PositionType,
  defenderPosition: PositionType
): DamageModifiers {
  const descriptions: string[] = [];

  // 1. Vantagem Elemental
  const elementalAdvantage = ELEMENT_ADVANTAGE[attackerElement]?.[defenderElement] ?? 1.0;
  if (elementalAdvantage > 1.0) {
    descriptions.push(`⚡ Vantagem Elemental: ${attackerElement} > ${defenderElement} (+${Math.round((elementalAdvantage - 1) * 100)}%)`);
  } else if (elementalAdvantage < 1.0) {
    descriptions.push(`❄️ Desvantagem Elemental: ${attackerElement} < ${defenderElement} (${Math.round((elementalAdvantage - 1) * 100)}%)`);
  }

  // 2. Counter de Papel
  const roleCounter = ROLE_COUNTER[attackerRole]?.[defenderRole] ?? 1.0;
  if (roleCounter > 1.0) {
    descriptions.push(`🎯 Counter de Papel: ${attackerRole} > ${defenderRole} (+${Math.round((roleCounter - 1) * 100)}%)`);
  } else if (roleCounter < 1.0) {
    descriptions.push(`🛡️ Resistência de Papel: ${attackerRole} < ${defenderRole} (${Math.round((roleCounter - 1) * 100)}%)`);
  }

  // 3. Modificador de Posição do Atacante (dano causado)
  const attackerPositionMod = POSITION_MODIFIERS[attackerPosition].damageDealt;
  if (attackerPositionMod !== 1.0) {
    descriptions.push(`📍 Posição ${attackerPosition}: ${attackerPositionMod > 1 ? '+' : ''}${Math.round((attackerPositionMod - 1) * 100)}% dano`);
  }

  // 4. Modificador de Posição do Defensor (dano recebido)
  const defenderPositionMod = POSITION_MODIFIERS[defenderPosition].damageTaken;
  if (defenderPositionMod !== 1.0) {
    descriptions.push(`🎯 Alvo em ${defenderPosition}: ${defenderPositionMod > 1 ? '+' : ''}${Math.round((defenderPositionMod - 1) * 100)}% dano recebido`);
  }

  // 5. Posição vs Posição (dificuldade de acertar)
  const positionVsPosition = POSITION_VS_POSITION[attackerPosition][defenderPosition];
  if (positionVsPosition !== 1.0) {
    descriptions.push(`🎪 ${attackerPosition} → ${defenderPosition}: ${positionVsPosition > 1 ? '+' : ''}${Math.round((positionVsPosition - 1) * 100)}% precisão`);
  }

  // Multiplicador total
  const total = elementalAdvantage * roleCounter * attackerPositionMod * defenderPositionMod * positionVsPosition;

  return {
    elementalAdvantage,
    roleCounter,
    attackerPosition: attackerPositionMod,
    defenderPosition: defenderPositionMod,
    positionVsPosition,
    total,
    description: descriptions,
  };
}

/**
 * Aplica modificadores ao dano base
 */
export function applyDamageModifiers(baseDamage: number, modifiers: DamageModifiers): number {
  return Math.round(baseDamage * modifiers.total);
}

/**
 * Retorna a posição recomendada para um personagem baseado no role
 */
export function getRecommendedPosition(role: RoleType): PositionType {
  switch (role) {
    case "tank":
      return "front";  // Tanks na frente absorvendo dano
    case "dps":
      return "mid";    // DPS no meio para balancear
    case "suporte":
      return "back";   // Suportes atrás protegidos
    case "controle":
      return "back";   // Controle atrás também
    default:
      return "mid";
  }
}

/**
 * Retorna descrição visual do modificador total
 */
export function getModifierEmoji(total: number): string {
  if (total >= 1.5) return "🔥🔥🔥 DEVASTADOR";
  if (total >= 1.3) return "🔥🔥 SUPER EFETIVO";
  if (total >= 1.1) return "🔥 EFETIVO";
  if (total > 0.9) return "⚔️ NORMAL";
  if (total > 0.75) return "🛡️ RESISTIDO";
  return "🛡️🛡️ MUITO RESISTIDO";
}

/**
 * Retorna emoji do elemento
 */
export function getElementEmoji(element: ElementType): string {
  const emojis: Record<ElementType, string> = {
    fire: "🔥",
    water: "💧",
    electric: "⚡",
    earth: "🌍",
    wind: "🌪️",
    light: "✨",
    dark: "🌑",
    neutral: "⚪",
  };
  return emojis[element];
}

/**
 * Retorna emoji da posição
 */
export function getPositionEmoji(position: PositionType): string {
  const emojis: Record<PositionType, string> = {
    front: "🛡️",
    mid: "⚔️",
    back: "🏹",
  };
  return emojis[position];
}
