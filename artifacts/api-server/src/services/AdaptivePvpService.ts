import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { BattleSnapshot, Combatant, UltimateDecisionProvider } from "../battle/BattleState";
import { getProfile, getTeam, listCharacters } from "./PhaseOneService";
import { applyMasteryBoost } from "./MasteryService";
import { logger } from "../lib/logger";
import crypto from "node:crypto";
import { applyTeamEquipment } from "./EquipmentBattleIntegration";

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
 * Calcula o poder total do time do jogador
 */
function calculateTotalPower(teamMembers: any[]): number {
  return teamMembers.reduce((sum, m) => {
    const char = m.character;
    const level = m.level || 1;
    const mastery = m.masteryLevel || 1;
    
    const boostedStats = applyMasteryBoost(
      char.baseHp,
      char.baseAttack,
      char.baseDefense,
      char.baseSpeed,
      mastery
    );
    
    const power = 
      (boostedStats.hp + level * 40) + 
      (boostedStats.attack + level * 8) * 2 + 
      (boostedStats.defense + level * 5) +
      boostedStats.speed;
    
    return sum + power;
  }, 0);
}

/**
 * Gera um time inimigo adaptativo baseado no progresso do jogador
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
  const playerTotalPower = calculateTotalPower(playerTeamMembers);
  
  console.log(`[ADAPTIVE PVP] Player metrics: Lv${playerAvgLevel}, Mastery${playerAvgMastery}, Power${playerTotalPower}, Size${playerTeamSize}`);
  
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
 * Roda uma batalha adaptativa de Arena PvP
 * Usa EXATAMENTE o mesmo motor que BattleService (BattleEngine)
 */
export async function runAdaptivePvpBattle(
  discordId: string,
  difficulty: "easy" | "normal" | "hard" | "nightmare" = "normal",
  onSnapshot?: BattleSnapshotHandler,
  ultimateDecisionProvider?: UltimateDecisionProvider
) {
  const profile = await getProfile(discordId);
  if (!profile) throw new AdaptivePvpError("Profile not found. Use /perfil to create your profile.");
  
  let teamData = await getTeam(discordId);
  
  console.log(`[ADAPTIVE PVP] User ${discordId} team status: team=${!!teamData?.team}, members=${teamData?.members.length ?? 0}`);
  
  // Cria time automático se necessário
  if (!teamData?.team && profile.collection.length > 0) {
    console.log(`[ADAPTIVE PVP] Auto-creating team from first ${Math.min(5, profile.collection.length)} characters`);
    const { replaceTeam } = await import("./PhaseOneService");
    await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
    teamData = await getTeam(discordId);
  }
  
  if (!teamData || !teamData.members.length) {
    throw new AdaptivePvpError("No characters in collection. Use /invocar to summon characters first.");
  }
  
  console.log(`[ADAPTIVE PVP] Starting battle with ${teamData.members.length} team members`);
  teamData.members.forEach((m, i) => {
    console.log(`[ADAPTIVE PVP]   ${i + 1}. ${m.character.name} (${m.ownedId})`);
  });

  // Cria combatentes do jogador (IGUAL BattleService)
  const player: Combatant[] = teamData.members.map(({ ownedId, level, character, masteryLevel, masteryXp }) => {
    const actualMasteryLevel = masteryLevel || 1;
    
    // Aplica boost de maestria aos stats base
    const boostedStats = applyMasteryBoost(
      character.baseHp,
      character.baseAttack,
      character.baseDefense,
      character.baseSpeed,
      actualMasteryLevel
    );
    
    // Calcula HP final com level + maestria
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

  // ⚔️ APLICA EQUIPAMENTOS AO TIME DO JOGADOR
  const userCharacterIds = teamData.members.map(m => m.ownedId);
  const playerWithEquipment = await applyTeamEquipment(player, userCharacterIds);
  console.log(`[ADAPTIVE PVP] Equipment applied to player team`);

  // Gera time inimigo adaptativo
  const { enemies, teamName } = await generateAdaptiveEnemyTeam(teamData.members, difficulty);
  
  console.log(`[ADAPTIVE PVP] Battle Start: Player (${playerWithEquipment.length}) vs ${teamName} (${enemies.length}) [${difficulty.toUpperCase()}]`);
  
  // Roda o engine (IGUAL BattleService)
  const result = await runEngine(new BattleEngine(playerWithEquipment, enemies), onSnapshot, ultimateDecisionProvider);
  
  const status = result.phase === "PLAYER_VICTORY" ? "victory" : result.phase === "ENEMY_VICTORY" ? "defeat" : "draw";
  
  // Calcula recompensas baseadas na dificuldade
  const baseRewards = {
    easy: { gold: 50, xp: 30, gems: 1 },
    normal: { gold: 100, xp: 60, gems: 2 },
    hard: { gold: 200, xp: 120, gems: 5 },
    nightmare: { gold: 400, xp: 250, gems: 10 }
  };
  
  const rewards = status === "victory" ? baseRewards[difficulty] : { gold: 0, xp: 0, gems: 0 };
  
  // Aplica recompensas
  if (status === "victory") {
    profile.user.gold += rewards.gold;
    profile.user.gems += rewards.gems;
    console.log(`[ADAPTIVE PVP] Victory! Rewards: ${rewards.gold} gold, ${rewards.xp} XP, ${rewards.gems} gems`);
  }
  
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
  
  return {
    snapshot: result,
    status,
    rewards,
    enemyTeamName: teamName,
    difficulty,
  };
}

/**
 * Lista batalhas de arena do jogador
 */
export async function listAdaptivePvpBattles(discordId: string) {
  const profile = await getProfile(discordId);
  if (!profile) return [];
  
  return memoryBattles
    .filter(b => b.userId === profile.user.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
}
