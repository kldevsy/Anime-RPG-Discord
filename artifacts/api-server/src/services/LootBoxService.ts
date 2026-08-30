import { db } from "@workspace/db";
import { 
  lootBoxOpenings,
  lootBoxPity,
  dailyFreeBox,
  users,
  equipment,
  userEquipment,
  type LootBoxOpening
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "node:crypto";

export type LootBoxType = "basic" | "advanced" | "epic" | "legendary" | "mythic";

export interface LootBoxReward {
  type: "gold" | "tickets" | "gems" | "equipment" | "mastery_xp" | "character" | "special";
  amount?: number;
  equipmentId?: string;
  equipmentName?: string;
  equipmentRarity?: string;
  characterId?: string;
  characterName?: string;
  specialItem?: string;
}

export interface LootBoxResult {
  rewards: LootBoxReward[];
  jackpot: boolean;
  pityTriggered: boolean;
}

// Configuração das Loot Boxes
const LOOT_BOX_CONFIG = {
  basic: {
    price: 50,
    rewardCount: 3,
    pools: [
      { type: "gold" as const, min: 100, max: 500, weight: 60 },
      { type: "tickets" as const, min: 1, max: 3, weight: 25 },
      { type: "equipment" as const, rarities: ["common", "uncommon"], weight: 10 },
      { type: "mastery_xp" as const, min: 50, max: 100, weight: 5 },
    ]
  },
  advanced: {
    price: 150,
    rewardCount: 5,
    pools: [
      { type: "gold" as const, min: 300, max: 1000, weight: 40 },
      { type: "tickets" as const, min: 3, max: 7, weight: 30 },
      { type: "equipment" as const, rarities: ["uncommon", "rare"], weight: 20 },
      { type: "mastery_xp" as const, min: 100, max: 250, weight: 8 },
      { type: "gems" as const, min: 10, max: 30, weight: 2 },
    ]
  },
  epic: {
    price: 400,
    rewardCount: 7,
    pools: [
      { type: "gold" as const, min: 800, max: 2500, weight: 30 },
      { type: "tickets" as const, min: 5, max: 15, weight: 25 },
      { type: "equipment" as const, rarities: ["rare", "epic"], weight: 30 },
      { type: "mastery_xp" as const, min: 250, max: 500, weight: 10 },
      { type: "gems" as const, min: 30, max: 100, weight: 4 },
      { type: "character" as const, rarities: ["rare", "epic"], weight: 1 },
    ]
  },
  legendary: {
    price: 1000,
    rewardCount: 10,
    pools: [
      { type: "gold" as const, min: 2000, max: 5000, weight: 25 },
      { type: "tickets" as const, min: 10, max: 30, weight: 20 },
      { type: "equipment" as const, rarities: ["epic", "legendary"], weight: 35 },
      { type: "mastery_xp" as const, min: 500, max: 1000, weight: 15 },
      { type: "gems" as const, min: 100, max: 300, weight: 4 },
      { type: "character" as const, rarities: ["epic", "legendary"], weight: 0.8 },
      { type: "special" as const, weight: 0.2 },
    ]
  },
  mythic: {
    price: 2500,
    rewardCount: 15,
    pools: [
      { type: "gold" as const, min: 5000, max: 10000, weight: 20 },
      { type: "tickets" as const, min: 20, max: 50, weight: 15 },
      { type: "equipment" as const, rarities: ["legendary", "mythic"], weight: 40 },
      { type: "mastery_xp" as const, min: 1000, max: 2000, weight: 15 },
      { type: "gems" as const, min: 200, max: 500, weight: 8 },
      { type: "character" as const, rarities: ["legendary", "mythic"], weight: 1.5 },
      { type: "special" as const, weight: 0.5 },
    ]
  }
};

export class LootBoxService {
  /**
   * Abre uma loot box
   */
  async openLootBox(userId: string, boxType: LootBoxType): Promise<LootBoxResult> {
    const config = LOOT_BOX_CONFIG[boxType];
    
    // Verificar saldo de gemas
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0] || user[0].gems < config.price) {
      throw new Error("Gemas insuficientes!");
    }
    
    // Deduzir gemas
    await db.update(users)
      .set({ gems: user[0].gems - config.price })
      .where(eq(users.id, userId));
    
    // Verificar pity
    const pity = await this.getPity(userId, boxType);
    const pityBonus = this.calculatePityBonus(pity.counter);
    
    // Gerar recompensas
    const rewards: LootBoxReward[] = [];
    let hasRareItem = false;
    
    for (let i = 0; i < config.rewardCount; i++) {
      const reward = await this.generateReward(config.pools, pityBonus);
      
      if (reward.type === "equipment" && 
          (reward.equipmentRarity === "epic" || 
           reward.equipmentRarity === "legendary" || 
           reward.equipmentRarity === "mythic")) {
        hasRareItem = true;
      }
      
      rewards.push(reward);
    }
    
    // Verificar jackpot (0.1% chance)
    const jackpot = Math.random() < 0.001;
    
    if (jackpot) {
      // Duplica todas as recompensas
      const duplicated = [...rewards];
      rewards.push(...duplicated);
    }
    
    // Aplicar recompensas ao usuário
    await this.applyRewards(userId, rewards);
    
    // Salvar abertura
    await db.insert(lootBoxOpenings).values({
      userId,
      boxType,
      gemsSpent: config.price,
      rewards: rewards.map(r => ({
        type: r.type,
        amount: r.amount,
        equipmentId: r.equipmentId,
        equipmentName: r.equipmentName,
        characterId: r.characterId,
        characterName: r.characterName,
        specialItem: r.specialItem,
      })),
      jackpot,
    });
    
    // Atualizar pity
    if (hasRareItem) {
      await this.resetPity(userId, boxType);
    } else {
      await this.incrementPity(userId, boxType);
    }
    
    return {
      rewards,
      jackpot,
      pityTriggered: pity.counter >= 10,
    };
  }
  
  /**
   * Gera uma recompensa aleatória
   */
  private async generateReward(pools: any[], pityBonus: number): Promise<LootBoxReward> {
    // Calcula peso total
    const totalWeight = pools.reduce((sum, pool) => sum + (pool.weight || 0), 0);
    
    // Aplica bonus de pity para equipamentos
    const adjustedPools = pools.map(pool => {
      if (pool.type === "equipment") {
        return { ...pool, weight: pool.weight * (1 + pityBonus) };
      }
      return pool;
    });
    
    const adjustedTotal = adjustedPools.reduce((sum, pool) => sum + pool.weight, 0);
    
    // Sorteia
    let random = Math.random() * adjustedTotal;
    
    for (const pool of adjustedPools) {
      random -= pool.weight;
      
      if (random <= 0) {
        switch (pool.type) {
          case "gold":
          case "tickets":
          case "gems":
          case "mastery_xp":
            return {
              type: pool.type,
              amount: Math.floor(Math.random() * (pool.max - pool.min + 1)) + pool.min,
            };
          
          case "equipment":
            return await this.generateEquipmentReward(pool.rarities);
          
          case "character":
            return this.generateCharacterReward(pool.rarities);
          
          case "special":
            return this.generateSpecialReward();
          
          default:
            return { type: "gold", amount: 100 };
        }
      }
    }
    
    // Fallback
    return { type: "gold", amount: 100 };
  }
  
  /**
   * Gera recompensa de equipamento
   */
  private async generateEquipmentReward(rarities: string[]): Promise<LootBoxReward> {
    // Busca equipamentos aleatórios da raridade
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    const equipments = await db
      .select()
      .from(equipment)
      .where(eq(equipment.rarity, rarity))
      .limit(50);
    
    if (equipments.length === 0) {
      return { type: "gold", amount: 500 };
    }
    
    const selected = equipments[Math.floor(Math.random() * equipments.length)];
    
    return {
      type: "equipment",
      equipmentId: selected.id,
      equipmentName: selected.name,
      equipmentRarity: selected.rarity,
    };
  }
  
  /**
   * Gera recompensa de personagem
   */
  private generateCharacterReward(rarities: string[]): LootBoxReward {
    // TODO: Implementar quando tiver sistema de dar personagem
    // Por enquanto, retorna gold equivalente
    return {
      type: "gold",
      amount: 2000,
    };
  }
  
  /**
   * Gera item especial
   */
  private generateSpecialReward(): LootBoxReward {
    const specials = [
      "character_fragment",
      "xp_potion",
      "luck_talisman",
      "golden_key"
    ];
    
    const selected = specials[Math.floor(Math.random() * specials.length)];
    
    return {
      type: "special",
      specialItem: selected,
    };
  }
  
  /**
   * Aplica recompensas ao usuário
   */
  private async applyRewards(userId: string, rewards: LootBoxReward[]): Promise<void> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;
    
    let goldGain = 0;
    let ticketsGain = 0;
    let gemsGain = 0;
    
    for (const reward of rewards) {
      switch (reward.type) {
        case "gold":
          goldGain += reward.amount || 0;
          break;
        
        case "tickets":
          ticketsGain += reward.amount || 0;
          break;
        
        case "gems":
          gemsGain += reward.amount || 0;
          break;
        
        case "equipment":
          if (reward.equipmentId) {
            await db.insert(userEquipment).values({
              userId,
              equipmentId: reward.equipmentId,
            });
          }
          break;
        
        // Outros tipos serão tratados separadamente
      }
    }
    
    // Atualiza moedas
    if (goldGain > 0 || ticketsGain > 0 || gemsGain > 0) {
      await db.update(users)
        .set({
          gold: user[0].gold + goldGain,
          tickets: user[0].tickets + ticketsGain,
          gems: user[0].gems + gemsGain,
        })
        .where(eq(users.id, userId));
    }
  }
  
  /**
   * Busca pity do usuário
   */
  async getPity(userId: string, boxType: LootBoxType): Promise<{ counter: number; lastRareAt: Date | null }> {
    const result = await db
      .select()
      .from(lootBoxPity)
      .where(and(
        eq(lootBoxPity.userId, userId),
        eq(lootBoxPity.boxType, boxType)
      ))
      .limit(1);
    
    if (result.length === 0) {
      // Cria novo registro
      await db.insert(lootBoxPity).values({
        userId,
        boxType,
        counter: 0,
      });
      
      return { counter: 0, lastRareAt: null };
    }
    
    return {
      counter: result[0].counter,
      lastRareAt: result[0].lastRareAt,
    };
  }
  
  /**
   * Incrementa contador de pity
   */
  private async incrementPity(userId: string, boxType: LootBoxType): Promise<void> {
    const pity = await this.getPity(userId, boxType);
    
    await db
      .update(lootBoxPity)
      .set({ counter: pity.counter + 1 })
      .where(and(
        eq(lootBoxPity.userId, userId),
        eq(lootBoxPity.boxType, boxType)
      ));
  }
  
  /**
   * Reseta contador de pity
   */
  private async resetPity(userId: string, boxType: LootBoxType): Promise<void> {
    await db
      .update(lootBoxPity)
      .set({ 
        counter: 0,
        lastRareAt: new Date(),
      })
      .where(and(
        eq(lootBoxPity.userId, userId),
        eq(lootBoxPity.boxType, boxType)
      ));
  }
  
  /**
   * Calcula bonus de pity
   */
  private calculatePityBonus(counter: number): number {
    if (counter >= 10) return 1.0; // Hard pity: 100% bonus
    if (counter >= 5) return 0.2;  // Soft pity: 20% bonus
    return 0;
  }
  
  /**
   * Lista histórico de aberturas
   */
  async getHistory(userId: string, limit: number = 20): Promise<LootBoxOpening[]> {
    return db
      .select()
      .from(lootBoxOpenings)
      .where(eq(lootBoxOpenings.userId, userId))
      .orderBy(desc(lootBoxOpenings.openedAt))
      .limit(limit);
  }
  
  /**
   * Estatísticas de aberturas
   */
  async getStats(userId: string): Promise<{
    totalOpened: number;
    totalGemsSpent: number;
    jackpotCount: number;
  }> {
    const history = await db
      .select()
      .from(lootBoxOpenings)
      .where(eq(lootBoxOpenings.userId, userId));
    
    return {
      totalOpened: history.length,
      totalGemsSpent: history.reduce((sum, h) => sum + h.gemsSpent, 0),
      jackpotCount: history.filter(h => h.jackpot).length,
    };
  }
  
  /**
   * Verifica se pode pegar caixa grátis diária
   */
  async canClaimDailyFreeBox(userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(dailyFreeBox)
      .where(eq(dailyFreeBox.userId, userId))
      .limit(1);
    
    if (result.length === 0) return true;
    
    const lastClaim = result[0].lastClaimedAt;
    const now = new Date();
    const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    
    return diffHours >= 24;
  }
  
  /**
   * Reivindica caixa grátis diária
   */
  async claimDailyFreeBox(userId: string): Promise<LootBoxResult> {
    const canClaim = await this.canClaimDailyFreeBox(userId);
    
    if (!canClaim) {
      throw new Error("Você já reivindicou sua caixa grátis hoje!");
    }
    
    // Atualiza último claim
    const existing = await db
      .select()
      .from(dailyFreeBox)
      .where(eq(dailyFreeBox.userId, userId))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(dailyFreeBox).values({ userId });
    } else {
      await db
        .update(dailyFreeBox)
        .set({ lastClaimedAt: new Date() })
        .where(eq(dailyFreeBox.userId, userId));
    }
    
    // Abre caixa básica sem custo
    return this.openLootBoxFree(userId, "basic");
  }
  
  /**
   * Abre loot box sem custo (para daily free)
   */
  private async openLootBoxFree(userId: string, boxType: LootBoxType): Promise<LootBoxResult> {
    const config = LOOT_BOX_CONFIG[boxType];
    
    // Gerar recompensas (sem deduzir gemas)
    const rewards: LootBoxReward[] = [];
    
    for (let i = 0; i < config.rewardCount; i++) {
      const reward = await this.generateReward(config.pools, 0);
      rewards.push(reward);
    }
    
    // Aplicar recompensas
    await this.applyRewards(userId, rewards);
    
    // Salvar abertura
    await db.insert(lootBoxOpenings).values({
      userId,
      boxType,
      gemsSpent: 0, // FREE
      rewards: rewards.map(r => ({
        type: r.type,
        amount: r.amount,
        equipmentId: r.equipmentId,
        equipmentName: r.equipmentName,
      })),
      jackpot: false,
    });
    
    return {
      rewards,
      jackpot: false,
      pityTriggered: false,
    };
  }
  
  /**
   * Retorna preços das loot boxes
   */
  static getPrices() {
    return {
      basic: LOOT_BOX_CONFIG.basic.price,
      advanced: LOOT_BOX_CONFIG.advanced.price,
      epic: LOOT_BOX_CONFIG.epic.price,
      legendary: LOOT_BOX_CONFIG.legendary.price,
      mythic: LOOT_BOX_CONFIG.mythic.price,
    };
  }
}

export const lootBoxService = new LootBoxService();
