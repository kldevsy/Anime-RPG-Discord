import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { BattleSnapshot, Combatant, UltimateDecisionProvider } from "../battle/BattleState";
import { getProfile, getTeam, listCharacters } from "./PhaseOneService";
import { applyMasteryBoost } from "./MasteryService";
import { logger } from "../lib/logger";
import crypto from "node:crypto";

export class AdaptivePvpError extends Error {}

export type BattleSnapshotHandler = (snapshot: BattleSnapshot) => Promise<void> | void;

interface MemoryBattleRecord {
  id: string;
  userId: string;
  status: "victory" | "defeat" | "draw";
  round: number;
  rewards: { gold: number; xp: number; gems: number };
  createdAt: Date;
  completedAt: Date;
}

const memoryBattles: MemoryBattleRecord[] = [];

/**
 * Função auxiliar para rodar o engine (copiada de BattleService)
 */
async function runEngine(engine: BattleEngine, onSnapshot?: BattleSnapshotHandler, ultimateDecisionProvider?: UltimateDecisionProvider): Promise<BattleSnapshot> {
  return onSnapshot ? engine.runAnimated(onSnapshot, 100, ultimateDecisionProvider) : engine.run();
}

/**
 * Calcula o nível médio do time
 */
function calculateAverageLevel(teamMembers: any[]): number {
  if (teamMembers.length === 0) return 1;
  const totalLevel = teamMembers.reduce((sum, m) => sum + (m.level || 1), 0);
  return Math.round(totalLevel / teamMembers.length);
}

/**
 * Calcula o nível de maestria médio
 */
function calculateAverageMastery(teamMembers: any[]): number {
  if (teamMembers.length === 0) return 1;
  const totalMastery = teamMembers.reduce((sum, m) => sum + (m.masteryLevel || 1), 0);
  return Math.round(totalMastery / teamMembers.length);
}

/**
 * Gera um time inimigo adaptativo baseado no progresso do jogador
 * (COPIADO DE BattleService mas gera múltiplos inimigos aleatórios)
 */
async function generateAdaptiveEnemyTeam(
  playerTeamMembers: any[],
  difficulty: "easy" | "normal" | "hard" | "nightmare" = "normal"
): Promise<{ enemies: Combatant[], teamName: string }> {
  
  const catalog = await listCharacters({});
  
  if (catalog.length === 0) {
    throw new AdaptivePvpError("No characters available in catalog for enemy team generation.");
  }
  
  // Calcula métricas do jogador
  const playerAvgLevel = calculateAverageLevel(playerTeamMembers);
  const playerAvgMastery = calculateAverageMastery(playerTeamMembers);
  const playerTeamSize = playerTeamMembers.length;
  
  console.log(`[ADAPTIVE PVP] Player metrics: Lv${playerAvgLevel}, Mastery${playerAvgMastery}, Size${playerTeamSize}`);
  
  // Multiplicadores de dificuldade
  const difficultyMultipliers = {
    easy: { level: 0.7, mastery: 0.8, stats: 0.85 },
    normal: { level: 1.0, mastery: 1.0, stats: 1.0 },
    hard: { level: 1.3, mastery: 1.2, stats: 1.15 },
    nightmare: { level: 1.6, mastery: 1.5, stats: 1.35 }
  };
  
  const multiplier = difficultyMultipliers[difficulty];
  
  // Calcula stats inimigos
  const enemyLevel = Math.max(1, Math.round(playerAvgLevel * multiplier.level));
  const enemyMastery = Math.max(1, Math.round(playerAvgMastery * multiplier.mastery));
  
  // Determina tamanho do time inimigo
  const enemyTeamSize = Math.min(5, Math.max(3, playerTeamSize + (difficulty === "nightmare" ? 1 : 0)));
  
  // Embaralha catálogo e seleciona personagens aleatórios
  const shuffled = [...catalog].sort(() => Math.random() - 0.5);
  const selectedChars = shuffled.slice(0, enemyTeamSize);
  
  // Gera nome do time baseado no anime dominante
  const animeCount: Record<string, number> = {};
  selectedChars.forEach(char => {
    animeCount[char.anime] = (animeCount[char.anime] || 0) + 1;
  });
  const dominantAnime = Object.entries(animeCount).sort((a, b) => b[1] - a[1])[0][0];
  
  const teamNames = [
    `Força de Elite ${dominantAnime}`,
    `Guarda Real ${dominantAnime}`,
    `Patrulha ${dominantAnime}`,
    `Esquadrão ${dominantAnime}`,
    `Defensores ${dominantAnime}`,
  ];
  const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
  
  // Cria combatentes inimigos (EXATAMENTE COMO BattleService)
  const enemies: Combatant[] = selectedChars.map((character, index) => {
    // Aplica boost de maestria
    const boostedStats = applyMasteryBoost(
      character.baseHp,
      character.baseAttack,
      character.baseDefense,
      character.baseSpeed,
      enemyMastery
    );
    
    // Aplica multiplicador de dificuldade
    const finalStats = {
      hp: Math.round(boostedStats.hp * multiplier.stats),
      attack: Math.round(boostedStats.attack * multiplier.stats),
      defense: Math.round(boostedStats.defense * multiplier.stats),
      speed: Math.round(boostedStats.speed * multiplier.stats),
    };
    
    // Calcula HP final com level (IGUAL BattleService)
    const maxHp = finalStats.hp + enemyLevel * 40;
    
    // Adiciona variação aleatória de ±5%
    const variance = 0.95 + Math.random() * 0.1;
    
    const enemyId = `enemy_${character.id}_${index}`;
    
    console.log(`[ADAPTIVE PVP] Enemy ${index + 1}: ${character.name} Lv${enemyLevel} M${enemyMastery} - HP${maxHp} ATK${Math.round((finalStats.attack + enemyLevel * 8) * variance)} DEF${Math.round((finalStats.defense + enemyLevel * 5) * variance)} SPD${finalStats.speed}`);
    
    // CRIA COMBATENTE EXATAMENTE COMO BattleService
    return SkillManager.createCombatant({
      id: enemyId,
      name: character.name,
      role: character.role,
      maxHp: Math.round(maxHp * variance),
      hp: Math.round(maxHp * variance),
      attack: Math.round((finalStats.attack + enemyLevel * 8) * variance),
      defense: Math.round((finalStats.defense + enemyLevel * 5) * variance),
      speed: finalStats.speed,
      critChance: 15 + (difficulty === "nightmare" ? 10 : difficulty === "hard" ? 5 : 0),
      critDamage: 1.5 + (difficulty === "nightmare" ? 0.3 : difficulty === "hard" ? 0.15 : 0),
      energy: 0,
      alive: true,
      passive: character.passive ?? undefined,
      ultimate: character.ultimate,
    });
  });
  
  return { enemies, teamName };
}

/**
 * Calcula recompensas (COPIADO DE BattleService)
 */
function calculateRewards(
  difficulty: "easy" | "normal" | "hard" | "nightmare",
  victory: boolean
): { gold: number, gems: number, xp: number } {
  
  const baseRewards = {
    easy: { gold: 100, gems: 5, xp: 50 },
    normal: { gold: 200, gems: 10, xp: 100 },
    hard: { gold: 350, gems: 20, xp: 200 },
    nightmare: { gold: 600, gems: 40, xp: 400 }
  };
  
  const base = baseRewards[difficulty];
  
  if (victory) {
    return base;
  } else {
    // Recompensa de consolação na derrota (30%)
    return {
      gold: Math.round(base.gold * 0.3),
      gems: Math.round(base.gems * 0.3),
      xp: Math.round(base.xp * 0.3)
    };
  }
}

/**
 * Executa uma batalha PvP adaptativa (COPIADO DE runPlayerBattle)
 */
export async function runAdaptivePvpBattle(
  discordId: string,
  difficulty: "easy" | "normal" | "hard" | "nightmare" = "normal",
  onSnapshot?: BattleSnapshotHandler,
  ultimateDecisionProvider?: UltimateDecisionProvider
): Promise<{
  battle: MemoryBattleRecord;
  result: BattleSnapshot;
  rewards: { gold: number; gems: number; xp: number };
  enemyTeamName: string;
}> {
  
  // Busca perfil e time do jogador (IGUAL BattleService)
  const profile = await getProfile(discordId);
  if (!profile) {
    throw new AdaptivePvpError("Profile not found. Use /perfil to create your profile.");
  }
  
  let teamData = await getTeam(discordId);
  
  // Auto-cria time se não existir (IGUAL BattleService)
  if (!teamData?.team && profile.collection.length > 0) {
    console.log(`[ADAPTIVE PVP] Auto-creating team from first ${Math.min(5, profile.collection.length)} characters`);
    const { replaceTeam } = await import("./PhaseOneService");
    await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
    teamData = await getTeam(discordId);
  }
  
  if (!teamData || !teamData.members.length) {
    throw new AdaptivePvpError("No characters in team. Use /equipe to build your team.");
  }
  
  // Cria time do jogador (EXATAMENTE COMO BattleService)
  const player: Combatant[] = teamData.members.map(({ ownedId, level, character, masteryLevel }) => {
    const actualMasteryLevel = masteryLevel || 1;
    
    const boostedStats = applyMasteryBoost(
      character.baseHp,
      character.baseAttack,
      character.baseDefense,
      character.baseSpeed,
      actualMasteryLevel
    );
    
    const maxHp = boostedStats.hp + level * 40;
    
    return SkillManager.createCombatant({
      id: ownedId,
      name: character.name,
      role: character.role,
      maxHp,
      hp: maxHp,
      attack: boostedStats.attack + level * 8,
      defense: boostedStats.defense + level * 5,
      speed: boostedStats.speed,
      critChance: 15,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      passive: character.passive ?? undefined,
      ultimate: character.ultimate,
    });
  });
  
  // Gera time inimigo adaptativo (SUBSTITUI stage.enemy)
  const { enemies, teamName: enemyTeamName } = await generateAdaptiveEnemyTeam(
    teamData.members,
    difficulty
  );
  
  console.log(`[ADAPTIVE PVP] Battle Start: Player (${player.length}) vs ${enemyTeamName} (${enemies.length}) [${difficulty.toUpperCase()}]`);
  
  // EXECUTA BATALHA EXATAMENTE COMO BattleService
  const result = await runEngine(new BattleEngine(player, enemies), onSnapshot, ultimateDecisionProvider);
  const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";
  const rewards = calculateRewards(difficulty, status === "victory");
  
  console.log(`[ADAPTIVE PVP] Battle End: ${status.toUpperCase()} | Rewards: ${rewards.gold}G, ${rewards.gems}💎, ${rewards.xp}XP`);
  
  // Cria registro de batalha (IGUAL BattleService)
  const battleRecord: MemoryBattleRecord = {
    id: crypto.randomUUID(),
    userId: profile.user.id,
    status,
    round: result.round,
    rewards,
    createdAt: new Date(),
    completedAt: new Date(),
  };
  memoryBattles.push(battleRecord);
  
  // TODO: Aplicar recompensas ao jogador (integrar com EconomyService)
  
  return {
    battle: battleRecord,
    result,
    rewards,
    enemyTeamName
  };
}
