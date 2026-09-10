import { db } from "@workspace/db";
import {
  raidInstances,
  raidInstanceParticipants,
  raidTeamMembers,
  raidCompletions,
  raidLeaderboard,
  raidFirstClears,
  users,
  userCharacters,
  characters,
  characterEquipped,
  equipment,
  userEquipment,
} from "@workspace/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { RAID_CATALOG, getRaidById, type RaidMap } from "@workspace/db/data/raid-catalog";
import { logger } from "../lib/logger";
import { RaidBattleEngine, createRaidFighterFromCharacter } from "./RaidBattleEngine";

type RaidDifficulty = "normal" | "hard" | "nightmare";
type RaidStatus = "waiting" | "in_progress" | "completed" | "failed" | "expired";

interface CreateRaidOptions {
  leaderId: string;
  raidMapId: string;
  difficulty: RaidDifficulty;
}

interface JoinRaidOptions {
  userId: string;
  roomCode: string;
}

interface AddCharacterOptions {
  raidInstanceId: string;
  userId: string;
  userCharacterId: string;
}

interface RaidRewards {
  gold: number;
  gems: number;
  masteryXp: number;
  tickets: number;
  equipment: Array<{ id: string; name: string; rarity: string }>;
  lootBoxes: Array<{ type: string }>;
}

/**
 * ========================================
 * RAID SERVICE
 * ========================================
 * 
 * Gerencia sistema cooperativo de raids:
 * - Criar e entrar em salas
 * - Adicionar personagens
 * - Executar batalhas
 * - Distribuir recompensas
 * - Leaderboard
 */
class RaidService {
  
  /**
   * Gera código único de sala (RAID-XXXX)
   */
  private generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1
    let code = "RAID-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Calcula tempo de expiração (15 minutos)
   */
  private getExpirationTime(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return now;
  }

  /**
   * Verifica se raid map existe e dificuldade é válida
   */
  private validateRaidMap(mapId: string, difficulty: RaidDifficulty): RaidMap {
    const raidMap = getRaidById(mapId);
    
    if (!raidMap) {
      throw new Error(`Raid map '${mapId}' não encontrado!`);
    }
    
    if (!raidMap.availableDifficulties.includes(difficulty)) {
      throw new Error(
        `Dificuldade '${difficulty}' não disponível para ${raidMap.name}. ` +
        `Disponíveis: ${raidMap.availableDifficulties.join(", ")}`
      );
    }
    
    return raidMap;
  }

  /**
   * ========================================
   * CRIAR RAID
   * ========================================
   */
  async createRaid(options: CreateRaidOptions) {
    const { leaderId, raidMapId, difficulty } = options;
    
    // Validar raid map
    const raidMap = this.validateRaidMap(raidMapId, difficulty);
    
    // Verificar se usuário existe
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.discordId, leaderId))
      .limit(1);
    
    if (!user) {
      throw new Error("Usuário não encontrado!");
    }
    
    // Verificar se já tem raid ativa
    const [existingRaid] = await db
      .select()
      .from(raidInstances)
      .innerJoin(
        raidInstanceParticipants,
        eq(raidInstances.id, raidInstanceParticipants.raidInstanceId)
      )
      .where(
        and(
          eq(raidInstanceParticipants.userId, user.id),
          sql`${raidInstances.status} IN ('waiting', 'in_progress')`
        )
      )
      .limit(1);
    
    if (existingRaid) {
      throw new Error(
        "Você já está em uma raid ativa! " +
        `Use \`/raid sair\` ou aguarde ela expirar.`
      );
    }
    
    // Gerar código único
    let roomCode = this.generateRoomCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const [existing] = await db
        .select()
        .from(raidInstances)
        .where(eq(raidInstances.roomCode, roomCode))
        .limit(1);
      
      if (!existing) break;
      
      roomCode = this.generateRoomCode();
      attempts++;
    }
    
    if (attempts >= 10) {
      throw new Error("Erro ao gerar código único. Tente novamente.");
    }
    
    // Criar instância da raid
    const [raidInstance] = await db
      .insert(raidInstances)
      .values({
        leaderId: user.id,
        raidMapId,
        difficulty,
        roomCode,
        status: "waiting",
        maxPlayers: 4,
        currentWave: 0,
        revivesUsed: 0,
        expiresAt: this.getExpirationTime(),
      })
      .returning();
    
    // Adicionar líder como participante
    await db.insert(raidInstanceParticipants).values({
      raidInstanceId: raidInstance.id,
      userId: user.id,
      isReady: false,
      contribution: 0,
    });
    
    logger.info(`[RAID] Created raid ${roomCode} - Map: ${raidMap.name}, Difficulty: ${difficulty}`);
    
    return {
      raidInstance,
      raidMap,
      roomCode,
    };
  }

  /**
   * ========================================
   * ENTRAR NA RAID
   * ========================================
   */
  async joinRaid(options: JoinRaidOptions) {
    const { userId, roomCode } = options;
    
    // Buscar raid
    const [raidInstance] = await db
      .select()
      .from(raidInstances)
      .where(
        and(
          eq(raidInstances.roomCode, roomCode.toUpperCase()),
          eq(raidInstances.status, "waiting")
        )
      )
      .limit(1);
    
    if (!raidInstance) {
      throw new Error(
        `Raid com código \`${roomCode}\` não encontrada ou já iniciada!`
      );
    }
    
    // Verificar expiração
    if (new Date() > raidInstance.expiresAt) {
      await db
        .update(raidInstances)
        .set({ status: "expired" })
        .where(eq(raidInstances.id, raidInstance.id));
      
      throw new Error("Esta raid expirou! Crie uma nova.");
    }
    
    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.discordId, userId))
      .limit(1);
    
    if (!user) {
      throw new Error("Usuário não encontrado!");
    }
    
    // Verificar se já está na raid
    const [existing] = await db
      .select()
      .from(raidInstanceParticipants)
      .where(
        and(
          eq(raidInstanceParticipants.raidInstanceId, raidInstance.id),
          eq(raidInstanceParticipants.userId, user.id)
        )
      )
      .limit(1);
    
    if (existing) {
      throw new Error("Você já está nesta raid!");
    }
    
    // Contar participantes atuais
    const participants = await db
      .select()
      .from(raidInstanceParticipants)
      .where(eq(raidInstanceParticipants.raidInstanceId, raidInstance.id));
    
    if (participants.length >= raidInstance.maxPlayers) {
      throw new Error("Raid está cheia! (4/4 jogadores)");
    }
    
    // Adicionar participante
    await db.insert(raidInstanceParticipants).values({
      raidInstanceId: raidInstance.id,
      userId: user.id,
      isReady: false,
      contribution: 0,
    });
    
    logger.info(`[RAID] User ${userId} joined raid ${roomCode}`);
    
    return {
      raidInstance,
      participantCount: participants.length + 1,
    };
  }

  /**
   * ========================================
   * ADICIONAR PERSONAGEM À RAID
   * ========================================
   */
  async addCharacter(options: AddCharacterOptions) {
    const { raidInstanceId, userId, userCharacterId } = options;
    const maxPositionRetries = 3;

    for (let attempt = 1; attempt <= maxPositionRetries; attempt++) {
      try {
        return await db.transaction(async (tx) => {
          const [raidInstance] = await tx
            .select()
            .from(raidInstances)
            .where(eq(raidInstances.id, raidInstanceId))
            .limit(1);

          if (!raidInstance) throw new Error("Raid não encontrada!");
          if (raidInstance.status !== "waiting") {
            throw new Error("Não é possível adicionar personagens após iniciar!");
          }

          const [user] = await tx
            .select()
            .from(users)
            .where(eq(users.discordId, userId))
            .limit(1);

          if (!user) throw new Error("Usuário não encontrado!");

          const [participant] = await tx
            .select()
            .from(raidInstanceParticipants)
            .where(and(
              eq(raidInstanceParticipants.raidInstanceId, raidInstanceId),
              eq(raidInstanceParticipants.userId, user.id)
            ))
            .limit(1);

          if (!participant) throw new Error("Você não está nesta raid!");

          const [userChar] = await tx
            .select({ userChar: userCharacters, char: characters })
            .from(userCharacters)
            .innerJoin(characters, eq(userCharacters.characterId, characters.id))
            .where(eq(userCharacters.id, userCharacterId))
            .limit(1);

          if (!userChar || userChar.userChar.userId !== user.id) {
            throw new Error("Personagem não encontrado ou não pertence a você!");
          }

          const teamMembers = await tx
            .select()
            .from(raidTeamMembers)
            .where(eq(raidTeamMembers.raidInstanceId, raidInstanceId))
            .orderBy(asc(raidTeamMembers.position));

          if (teamMembers.length >= 4) {
            throw new Error("Equipe já está completa! (4/4 personagens)");
          }

          const usedPositions = new Set(teamMembers.map(member => member.position));
          const position = [1, 2, 3, 4].find(candidate => !usedPositions.has(candidate));

          if (!position) throw new Error("Todas as posições estão ocupadas!");

          const baseHp = userChar.char.baseHp;
          const level = userChar.userChar.level;
          const masteryLevel = userChar.userChar.masteryLevel || 1;

          if (!baseHp || baseHp <= 0) throw new Error(`HP base inválido: ${baseHp}`);
          if (!level || level <= 0) throw new Error(`Level inválido: ${level}`);

          const masteryBoost = Math.floor(baseHp * ((masteryLevel - 1) * 0.05));
          const currentHp = baseHp + (level * 10) + masteryBoost;

          await tx.insert(raidTeamMembers).values({
            raidInstanceId,
            participantId: participant.id,
            userCharacterId,
            position,
            isAlive: true,
            currentHp,
            damageDone: 0,
          });

          await tx
            .update(raidInstanceParticipants)
            .set({ contribution: sql`${raidInstanceParticipants.contribution} + 1` })
            .where(eq(raidInstanceParticipants.id, participant.id));

          logger.info(`[RAID] Added character ${userChar.char.name} to raid ${raidInstance.roomCode}`);

          return {
            character: userChar.char,
            position,
            currentTeamSize: teamMembers.length + 1,
          };
        });
      } catch (error) {
        if (this.isRaidCharacterUniqueViolation(error)) {
          throw new Error("Este personagem já está na equipe!");
        }

        if (this.isRaidPositionUniqueViolation(error) && attempt < maxPositionRetries) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Não foi possível alocar uma posição na equipe. Tente novamente.");
  }

  private isUniqueViolation(error: unknown, indexName: string): boolean {
    const databaseError = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
    const cause = databaseError?.cause;

    return (
      (databaseError?.code === "23505" && databaseError.constraint === indexName) ||
      (cause?.code === "23505" && cause.constraint === indexName)
    );
  }

  private isRaidCharacterUniqueViolation(error: unknown): boolean {
    return this.isUniqueViolation(error, "raid_team_members_raid_character_unique");
  }

  private isRaidPositionUniqueViolation(error: unknown): boolean {
    return this.isUniqueViolation(error, "raid_team_members_raid_position_unique");
  }

  /**
   * ========================================
   * BUSCAR STATUS DA RAID
   * ========================================
   */
  async getRaidStatus(roomCode: string) {
    const [raidInstance] = await db
      .select()
      .from(raidInstances)
      .where(eq(raidInstances.roomCode, roomCode.toUpperCase()))
      .limit(1);
    
    if (!raidInstance) {
      throw new Error(`Raid ${roomCode} não encontrada!`);
    }
    
    // Buscar participantes
    const participants = await db
      .select({
        participant: raidInstanceParticipants,
        user: users,
      })
      .from(raidInstanceParticipants)
      .innerJoin(users, eq(raidInstanceParticipants.userId, users.id))
      .where(eq(raidInstanceParticipants.raidInstanceId, raidInstance.id));
    
    // Buscar personagens do time
    const teamMembers = await db
      .select({
        member: raidTeamMembers,
        userChar: userCharacters,
        char: characters,
        participant: raidInstanceParticipants,
        user: users,
      })
      .from(raidTeamMembers)
      .innerJoin(userCharacters, eq(raidTeamMembers.userCharacterId, userCharacters.id))
      .innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .innerJoin(raidInstanceParticipants, eq(raidTeamMembers.participantId, raidInstanceParticipants.id))
      .innerJoin(users, eq(raidInstanceParticipants.userId, users.id))
      .where(eq(raidTeamMembers.raidInstanceId, raidInstance.id))
      .orderBy(raidTeamMembers.position);
    
    // Buscar raid map
    const raidMap = getRaidById(raidInstance.raidMapId);
    
    return {
      raidInstance,
      raidMap,
      participants,
      teamMembers,
    };
  }

  /**
   * ========================================
   * CALCULAR RECOMPENSAS
   * ========================================
   */
  private calculateRewards(
    raidMap: RaidMap,
    difficulty: RaidDifficulty,
    participantCount: number,
    isFirstClear: boolean
  ): RaidRewards {
    const baseRewards = raidMap.baseRewards[difficulty];
    
    // Random dentro do range
    const gold = Math.floor(
      Math.random() * (baseRewards.gold[1] - baseRewards.gold[0] + 1) + baseRewards.gold[0]
    );
    const gems = Math.floor(
      Math.random() * (baseRewards.gems[1] - baseRewards.gems[0] + 1) + baseRewards.gems[0]
    );
    const masteryXp = Math.floor(
      Math.random() * (baseRewards.masteryXp[1] - baseRewards.masteryXp[0] + 1) + baseRewards.masteryXp[0]
    );
    const tickets = Math.floor(
      Math.random() * (baseRewards.tickets[1] - baseRewards.tickets[0] + 1) + baseRewards.tickets[0]
    );
    
    // Bônus de grupo
    const groupBonus = participantCount === 2 ? 1.1 : participantCount === 3 ? 1.25 : participantCount === 4 ? 1.5 : 1.0;
    
    // Bônus primeira clear
    const firstClearBonus = isFirstClear
      ? difficulty === "normal"
        ? 2
        : difficulty === "hard"
        ? 3
        : 5
      : 1;
    
    const finalGold = Math.floor(gold * groupBonus * firstClearBonus);
    const finalGems = Math.floor(gems * groupBonus * firstClearBonus);
    const finalMasteryXp = Math.floor(masteryXp * groupBonus * firstClearBonus);
    const finalTickets = Math.floor(tickets * groupBonus * firstClearBonus);
    
    // Equipamentos especiais (drops)
    const equipment: Array<{ id: string; name: string; rarity: string }> = [];
    for (const drop of raidMap.specialDrops) {
      const roll = Math.random() * 100;
      if (roll < drop.dropChance * groupBonus) {
        equipment.push({
          id: `equipment_${drop.equipmentName.toLowerCase().replace(/\s+/g, "_")}`,
          name: drop.equipmentName,
          rarity: drop.rarity,
        });
      }
    }
    
    // Loot boxes
    const lootBoxes: Array<{ type: string }> = [];
    const lootBoxDrops = raidMap.lootBoxDrops[difficulty];
    
    for (const drop of lootBoxDrops) {
      const roll = Math.random() * 100;
      if (roll < drop.chance) {
        lootBoxes.push({ type: drop.type });
      }
    }
    
    return {
      gold: finalGold,
      gems: finalGems,
      masteryXp: finalMasteryXp,
      tickets: finalTickets,
      equipment,
      lootBoxes,
    };
  }

  /**
   * ========================================
   * COMPLETAR RAID (VITÓRIA)
   * ========================================
   */
  async completeRaid(raidInstanceId: string, clearTimeSeconds: number) {
    const [raidInstance] = await db
      .select()
      .from(raidInstances)
      .where(eq(raidInstances.id, raidInstanceId))
      .limit(1);
    
    if (!raidInstance) {
      throw new Error("Raid não encontrada!");
    }
    
    const raidMap = getRaidById(raidInstance.raidMapId);
    if (!raidMap) {
      throw new Error("Raid map não encontrado!");
    }
    
    // Buscar participantes
    const participants = await db
      .select({
        participant: raidInstanceParticipants,
        user: users,
      })
      .from(raidInstanceParticipants)
      .innerJoin(users, eq(raidInstanceParticipants.userId, users.id))
      .where(eq(raidInstanceParticipants.raidInstanceId, raidInstanceId));
    
    // Buscar team members para calcular dano total
    const teamMembers = await db
      .select()
      .from(raidTeamMembers)
      .where(eq(raidTeamMembers.raidInstanceId, raidInstanceId));
    
    const totalDamage = teamMembers.reduce((sum, member) => sum + member.damageDone, 0);
    const deathCount = teamMembers.filter((member) => !member.isAlive).length;
    
    // Calcular recompensas para cada participante
    const rewardsByUser: Record<string, RaidRewards> = {};
    
    for (const { user } of participants) {
      // Verificar primeira clear
      const [firstClear] = await db
        .select()
        .from(raidFirstClears)
        .where(
          and(
            eq(raidFirstClears.userId, user.id),
            eq(raidFirstClears.raidMapId, raidInstance.raidMapId),
            eq(raidFirstClears.difficulty, raidInstance.difficulty)
          )
        )
        .limit(1);
      
      const isFirstClear = !firstClear;
      
      // Calcular recompensas
      const rewards = this.calculateRewards(
        raidMap,
        raidInstance.difficulty,
        participants.length,
        isFirstClear
      );
      
      rewardsByUser[user.id] = rewards;
      
      // Aplicar recompensas
      await db
        .update(users)
        .set({
          gold: sql`${users.gold} + ${rewards.gold}`,
          gems: sql`${users.gems} + ${rewards.gems}`,
          tickets: sql`${users.tickets} + ${rewards.tickets}`,
        })
        .where(eq(users.id, user.id));
      
      // Registrar primeira clear
      if (isFirstClear) {
        await db.insert(raidFirstClears).values({
          userId: user.id,
          raidMapId: raidInstance.raidMapId,
          difficulty: raidInstance.difficulty,
        });
      }
      
      // Atualizar/criar entrada no leaderboard
      const [leaderboardEntry] = await db
        .select()
        .from(raidLeaderboard)
        .where(
          and(
            eq(raidLeaderboard.userId, user.id),
            eq(raidLeaderboard.raidMapId, raidInstance.raidMapId),
            eq(raidLeaderboard.difficulty, raidInstance.difficulty)
          )
        )
        .limit(1);
      
      if (leaderboardEntry) {
        // Atualizar se tempo for melhor
        if (clearTimeSeconds < leaderboardEntry.bestTime) {
          await db
            .update(raidLeaderboard)
            .set({
              bestTime: clearTimeSeconds,
              totalClears: sql`${raidLeaderboard.totalClears} + 1`,
              fastestClearDate: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(raidLeaderboard.id, leaderboardEntry.id));
        } else {
          await db
            .update(raidLeaderboard)
            .set({
              totalClears: sql`${raidLeaderboard.totalClears} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(raidLeaderboard.id, leaderboardEntry.id));
        }
      } else {
        // Criar nova entrada
        await db.insert(raidLeaderboard).values({
          userId: user.id,
          raidMapId: raidInstance.raidMapId,
          difficulty: raidInstance.difficulty,
          bestTime: clearTimeSeconds,
          totalClears: 1,
        });
      }
    }
    
    // Registrar completion
    await db.insert(raidCompletions).values({
      raidInstanceId,
      raidMapId: raidInstance.raidMapId,
      difficulty: raidInstance.difficulty,
      participants: participants.map(({ user }) => user.id),
      clearTime: clearTimeSeconds,
      totalDamage,
      deathCount,
      rewards: rewardsByUser,
    });
    
    // Atualizar status da raid
    await db
      .update(raidInstances)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(raidInstances.id, raidInstanceId));
    
    logger.info(`[RAID] Completed raid ${raidInstance.roomCode} - Time: ${clearTimeSeconds}s`);
    
    return {
      rewards: rewardsByUser,
      clearTime: clearTimeSeconds,
      totalDamage,
      deathCount,
    };
  }

  /**
   * ========================================
   * BUSCAR LEADERBOARD
   * ========================================
   */
  async getLeaderboard(raidMapId: string, difficulty: RaidDifficulty, limit = 10) {
    const entries = await db
      .select({
        entry: raidLeaderboard,
        user: users,
      })
      .from(raidLeaderboard)
      .innerJoin(users, eq(raidLeaderboard.userId, users.id))
      .where(
        and(
          eq(raidLeaderboard.raidMapId, raidMapId),
          eq(raidLeaderboard.difficulty, difficulty)
        )
      )
      .orderBy(raidLeaderboard.bestTime)
      .limit(limit);
    
    return entries;
  }

  /**
   * ========================================
   * SAIR DA RAID
   * ========================================
   */
  async leaveRaid(userId: string, raidInstanceId: string) {
    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.discordId, userId))
      .limit(1);
    
    if (!user) {
      throw new Error("Usuário não encontrado!");
    }
    
    // Buscar raid
    const [raidInstance] = await db
      .select()
      .from(raidInstances)
      .where(eq(raidInstances.id, raidInstanceId))
      .limit(1);
    
    if (!raidInstance) {
      throw new Error("Raid não encontrada!");
    }
    
    // Se líder sair, cancelar raid
    if (raidInstance.leaderId === user.id) {
      await db
        .update(raidInstances)
        .set({ status: "expired" })
        .where(eq(raidInstances.id, raidInstanceId));
      
      logger.info(`[RAID] Leader left, raid ${raidInstance.roomCode} cancelled`);
      
      return { cancelled: true };
    }
    
    // Remover participante (cascade vai deletar personagens)
    await db
      .delete(raidInstanceParticipants)
      .where(
        and(
          eq(raidInstanceParticipants.raidInstanceId, raidInstanceId),
          eq(raidInstanceParticipants.userId, user.id)
        )
      );
    
    logger.info(`[RAID] User ${userId} left raid ${raidInstance.roomCode}`);
    
    return { cancelled: false };
  }

  /**
   * ========================================
   * LISTAR RAIDS DISPONÍVEIS
   * ========================================
   */
  getAvailableRaids(playerLevel: number) {
    return RAID_CATALOG.filter((raid) => playerLevel >= raid.minLevel);
  }

  /**
   * ========================================
   * LIMPAR RAIDS EXPIRADAS (Cron job)
   * ========================================
   */
  async cleanupExpiredRaids() {
    const now = new Date();
    
    const result = await db
      .update(raidInstances)
      .set({ status: "expired" })
      .where(
        and(
          sql`${raidInstances.expiresAt} < ${now}`,
          sql`${raidInstances.status} = 'waiting'`
        )
      )
      .returning();
    
    if (result.length > 0) {
      logger.info(`[RAID] Cleaned up ${result.length} expired raids`);
    }
    
    return result.length;
  }

  /**
   * ========================================
   * INICIAR BATALHA DA RAID
   * ========================================
   */
  async startRaidBattle(raidInstanceId: string, userId: string) {
    const [raidInstance] = await db
      .select()
      .from(raidInstances)
      .where(eq(raidInstances.id, raidInstanceId))
      .limit(1);
    
    if (!raidInstance) {
      throw new Error("Raid não encontrada!");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.discordId, userId))
      .limit(1);

    if (!user) {
      throw new Error("Usuário não encontrado!");
    }

    if (raidInstance.leaderId !== user.id) {
      throw new Error("Apenas o líder pode iniciar a raid!");
    }
    
    if (raidInstance.status !== "waiting") {
      throw new Error("Raid já foi iniciada ou finalizada!");
    }
    
    // Buscar raid map
    const raidMap = getRaidById(raidInstance.raidMapId);
    if (!raidMap) {
      throw new Error("Raid map não encontrado!");
    }
    
    // Buscar personagens do time
    const teamMembers = await db
      .select({
        member: raidTeamMembers,
        userChar: userCharacters,
        char: characters,
      })
      .from(raidTeamMembers)
      .innerJoin(userCharacters, eq(raidTeamMembers.userCharacterId, userCharacters.id))
      .innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .where(eq(raidTeamMembers.raidInstanceId, raidInstanceId))
      .orderBy(raidTeamMembers.position);
    
    if (teamMembers.length !== 4) {
      throw new Error("Time precisa ter 4 personagens para iniciar!");
    }
    
    // Buscar equipamentos
    const playerTeam = [];
    
    for (const { member, userChar, char } of teamMembers) {
      // Buscar equipamento equipado
      const [equipped] = await db
        .select({
          equipment: equipment,
        })
        .from(characterEquipped)
        .innerJoin(userEquipment, eq(characterEquipped.userEquipmentId, userEquipment.id))
        .innerJoin(equipment, eq(userEquipment.equipmentId, equipment.id))
        .where(eq(characterEquipped.userCharacterId, userChar.id))
        .limit(1);
      
      const fighter = createRaidFighterFromCharacter(
        userChar,
        char,
        equipped?.equipment || null
      );
      
      playerTeam.push(fighter);
    }
    
    // Atualizar status da raid para "em progresso"
    await db
      .update(raidInstances)
      .set({ status: "in_progress" })
      .where(eq(raidInstances.id, raidInstanceId));
    
    // Criar engine de batalha
    const battleEngine = new RaidBattleEngine(
      raidMap,
      raidInstance.difficulty,
      playerTeam
    );
    
    // Executar raid
    logger.info(`[RAID] Starting battle for raid ${raidInstance.roomCode}`);
    const result = await battleEngine.executeRaid();
    
    // Atualizar estado dos personagens
    for (const fighter of playerTeam) {
      await db
        .update(raidTeamMembers)
        .set({
          isAlive: fighter.isAlive,
          currentHp: fighter.hp,
          damageDone: result.damageByCharacter[fighter.id] || 0,
        })
        .where(
          and(
            eq(raidTeamMembers.raidInstanceId, raidInstanceId),
            eq(raidTeamMembers.userCharacterId, fighter.id)
          )
        );
    }
    
    // Se vitória, completar raid e distribuir recompensas
    if (result.victory) {
      await this.completeRaid(raidInstanceId, result.timeElapsed);
    } else {
      // Derrota
      await db
        .update(raidInstances)
        .set({ status: "failed" })
        .where(eq(raidInstances.id, raidInstanceId));
    }
    
    return result;
  }
}

export const raidService = new RaidService();
