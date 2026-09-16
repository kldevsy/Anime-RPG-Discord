import { createInsertSchema } from "drizzle-zod";
import type { CharacterUltimate } from "../data/characters.ts";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const characterRarities = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
] as const;
export const rarityEnum = pgEnum("character_rarity", characterRarities);

export const characterRoles = [
  "tank",
  "dps",
  "support",
  "healer",
  "control",
] as const;
export const roleEnum = pgEnum("character_role", characterRoles);
export const elementEnum = pgEnum("element_type", ["fire", "water", "electric", "earth", "wind", "light", "dark", "neutral"]);
export const positionEnum = pgEnum("position_type", ["front", "mid", "back"]);
export const bannerTypeEnum = pgEnum("banner_type", ["normal", "limited", "event"]);
export const currencyEnum = pgEnum("currency", ["gold", "gems", "tickets"]);
export const battleStatusEnum = pgEnum("battle_status", ["running", "victory", "defeat", "draw"]);
export const pveTypeEnum = pgEnum("pve_type", ["story", "dungeon", "boss", "tower", "event", "raid"]);
export const questCategoryEnum = pgEnum("quest_category", ["daily", "weekly", "monthly", "story", "event"]);
export const equipableTypeEnum = pgEnum("equipable_type", ["character", "role", "universal"]);
export const lootBoxTypeEnum = pgEnum("loot_box_type", ["basic", "advanced", "epic", "legendary", "mythic"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  gold: integer("gold").notNull().default(0),
  gems: integer("gems").notNull().default(1000),
  tickets: integer("tickets").notNull().default(10),
  totalBattlesWon: integer("total_battles_won").notNull().default(0),
  totalSummons: integer("total_summons").notNull().default(0),
  totalPveCleared: integer("total_pve_cleared").notNull().default(0),
  highestTeamPower: integer("highest_team_power").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  anime: text("anime").notNull(),
  name: text("name").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  role: roleEnum("role").notNull(),
  element: elementEnum("element").notNull().default("neutral"),
  defaultPosition: positionEnum("default_position").notNull().default("mid"),
  level: integer("level").notNull().default(1),
  baseHp: integer("base_hp").notNull(),
  baseAttack: integer("base_attack").notNull(),
  baseDefense: integer("base_defense").notNull(),
  baseSpeed: integer("base_speed").notNull(),
  imageUrl: text("image_url"),
  bannerUrl: text("banner_url"), // Novo: banner do personagem
  passive: text("passive"),
  // Seeded catalog rows are synchronized by `src/seed.ts`; administrative rows opt out.
  catalogManaged: boolean("catalog_managed").notNull().default(false),
  // Catalog entries always provide this; null preserves legacy characters.
  ultimate: jsonb("ultimate").$type<CharacterUltimate | null>(),
  evolution: jsonb("evolution").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("characters_anime_name_unique").on(table.anime, table.name),
]);

export const userCharacters = pgTable("user_characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "restrict" }),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  masteryLevel: integer("mastery_level").notNull().default(1),
  masteryXp: integer("mastery_xp").notNull().default(0),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_characters_user_character_unique").on(table.userId, table.characterId),
]);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Equipe principal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("teams_user_name_unique").on(table.userId, table.name),
]);

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userCharacterId: uuid("user_character_id").notNull().references(() => userCharacters.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  battlePosition: positionEnum("battle_position").notNull().default("mid"),
}, (table) => [
  primaryKey({ columns: [table.teamId, table.userCharacterId] }),
  uniqueIndex("team_members_team_position_unique").on(table.teamId, table.position),
]);

export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: bannerTypeEnum("type").notNull(),
  costCurrency: currencyEnum("cost_currency").notNull().default("tickets"),
  singleCost: integer("single_cost").notNull().default(1),
  tenCost: integer("ten_cost").notNull().default(10),
  rates: jsonb("rates").$type<Record<string, number>>().notNull(),
  softPityStart: integer("soft_pity_start").notNull().default(70),
  hardPity: integer("hard_pity").notNull().default(90),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const summons = pgTable("summons", {
  id: uuid("id").defaultRandom().primaryKey(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bannerId: uuid("banner_id").notNull().references(() => banners.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  results: jsonb("results").$type<Array<{ characterId: string; ownedId: string; name: string; anime: string; rarity: string; imageUrl: string | null; ultimate: CharacterUltimate | null }>>().notNull(),
  currency: currencyEnum("currency").notNull(),
  cost: integer("cost").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bannerPity = pgTable("banner_pity", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bannerId: uuid("banner_id").notNull().references(() => banners.id, { onDelete: "cascade" }),
  count: integer("count").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.userId, table.bannerId] }),
]);

export const inventory = pgTable("inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemKey: text("item_key").notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("inventory_user_item_unique").on(table.userId, table.itemKey),
]);

export const economyTransactions = pgTable("economy_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currency: currencyEnum("currency").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  referenceId: text("reference_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("economy_transactions_reference_unique").on(table.referenceId),
]);

export const battles = pgTable("battles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: battleStatusEnum("status").notNull(),
  round: integer("round").notNull(),
  rewards: jsonb("rewards").$type<{ gold: number; xp: number }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const battleSnapshots = pgTable("battle_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  battleId: uuid("battle_id").notNull().references(() => battles.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  turn: integer("turn").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const battleActions = pgTable("battle_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  battleId: uuid("battle_id").notNull().references(() => battles.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  actorId: text("actor_id").notNull(),
  actionType: text("action_type").notNull(),
  targetId: text("target_id"),
  amount: integer("amount"),
  critical: integer("critical").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pveWorlds = pgTable("pve_worlds", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  position: integer("position").notNull(),
  active: integer("active").notNull().default(1),
});

export const pveStages = pgTable("pve_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  worldId: uuid("world_id").notNull().references(() => pveWorlds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: pveTypeEnum("type").notNull().default("story"),
  position: integer("position").notNull(),
  enemyName: text("enemy_name").notNull(),
  enemyHp: integer("enemy_hp").notNull(),
  enemyAttack: integer("enemy_attack").notNull(),
  enemyDefense: integer("enemy_defense").notNull(),
  enemySpeed: integer("enemy_speed").notNull(),
  bossPhases: integer("boss_phases").notNull().default(1),
  enrageRound: integer("enrage_round").notNull().default(10),
  drops: jsonb("drops").$type<Array<{ itemKey: string; quantity: number; chance: number }>>().default([]),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardXp: integer("reward_xp").notNull().default(0),
  active: integer("active").notNull().default(1),
});

export const userPveProgress = pgTable("user_pve_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stageId: uuid("stage_id").notNull().references(() => pveStages.id, { onDelete: "cascade" }),
  clearedAt: timestamp("cleared_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_pve_progress_user_stage_unique").on(table.userId, table.stageId),
]);

export const quests = pgTable("quests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: questCategoryEnum("category").notNull(),
  requirementType: text("requirement_type").notNull(),
  requirementCount: integer("requirement_count").notNull(),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardGems: integer("reward_gems").notNull().default(0),
  rewardTickets: integer("reward_tickets").notNull().default(0),
  rewardItems: jsonb("reward_items").$type<Array<{ itemKey: string; quantity: number }>>().default([]),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userQuests = pgTable("user_quests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questId: uuid("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  completed: integer("completed").notNull().default(0),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_quests_user_quest_unique").on(table.userId, table.questId),
]);

export const dailyRewards = pgTable("daily_rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  streak: integer("streak").notNull().default(0),
  lastClaimedAt: timestamp("last_claimed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  enemyName: text("enemy_name").notNull(),
  enemyHp: integer("enemy_hp").notNull(),
  enemyAttack: integer("enemy_attack").notNull(),
  enemyDefense: integer("enemy_defense").notNull(),
  enemySpeed: integer("enemy_speed").notNull(),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardGems: integer("reward_gems").notNull().default(0),
  rewardTickets: integer("reward_tickets").notNull().default(0),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userEvents = pgTable("user_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  completed: integer("completed").notNull().default(0),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("user_events_user_event_unique").on(table.userId, table.eventId),
]);

export const raids = pgTable("raids", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  bossName: text("boss_name").notNull(),
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  bossAttack: integer("boss_attack").notNull(),
  bossDefense: integer("boss_defense").notNull(),
  bossSpeed: integer("boss_speed").notNull(),
  bossPhases: integer("boss_phases").notNull().default(1),
  enrageRound: integer("enrage_round").notNull().default(10),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardGems: integer("reward_gems").notNull().default(0),
  active: integer("active").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const raidParticipants = pgTable("raid_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  raidId: uuid("raid_id").notNull().references(() => raids.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  damageDealt: integer("damage_dealt").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("raid_participants_raid_user_unique").on(table.raidId, table.userId),
]);

export const pvpProfiles = pgTable("pvp_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  rating: integer("rating").notNull().default(1000),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pvpMatches = pgTable("pvp_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengerId: uuid("challenger_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  defenderId: uuid("defender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  winnerId: uuid("winner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  ratingChange: integer("rating_change").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const towerProgress = pgTable("tower_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  highestFloor: integer("highest_floor").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Equipment tables
export const equipment = pgTable("equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  description: text("description").notNull(),
  equipableType: equipableTypeEnum("equipable_type").notNull(),
  equipableTarget: text("equipable_target"), // character name or role
  bonusHp: integer("bonus_hp").notNull().default(0),
  bonusAttack: integer("bonus_attack").notNull().default(0),
  bonusDefense: integer("bonus_defense").notNull().default(0),
  bonusSpeed: integer("bonus_speed").notNull().default(0),
  bonusCritChance: integer("bonus_crit_chance").notNull().default(0),
  bonusCritDamage: integer("bonus_crit_damage").notNull().default(0),
  passiveAbility: jsonb("passive_ability").$type<Record<string, unknown> | null>(),
  imageUrl: text("image_url"),
  catalogManaged: boolean("catalog_managed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("equipment_name_unique").on(table.name),
]);

export const userEquipment = pgTable("user_equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id").notNull().references(() => equipment.id, { onDelete: "restrict" }),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characterEquipped = pgTable("character_equipped", {
  userCharacterId: uuid("user_character_id").primaryKey().references(() => userCharacters.id, { onDelete: "cascade" }),
  userEquipmentId: uuid("user_equipment_id").unique().references(() => userEquipment.id, { onDelete: "set null" }),
});

// Loot Box tables
export const lootBoxOpenings = pgTable("loot_box_openings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  boxType: lootBoxTypeEnum("box_type").notNull(),
  gemsSpent: integer("gems_spent").notNull(),
  rewards: jsonb("rewards").$type<Array<{
    type: "gold" | "tickets" | "gems" | "equipment" | "mastery_xp" | "character" | "special";
    amount?: number;
    equipmentId?: string;
    equipmentName?: string;
    characterId?: string;
    characterName?: string;
    specialItem?: string;
  }>>().notNull(),
  jackpot: boolean("jackpot").notNull().default(false),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lootBoxPity = pgTable("loot_box_pity", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  boxType: lootBoxTypeEnum("box_type").notNull(),
  counter: integer("counter").notNull().default(0),
  lastRareAt: timestamp("last_rare_at", { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.boxType] }),
]);

export const dailyFreeBox = pgTable("daily_free_box", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  lastClaimedAt: timestamp("last_claimed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const masteryXpInventory = pgTable("mastery_xp_inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  accumulatedXp: integer("accumulated_xp").notNull().default(0),
});

// ========================================
// RAID SYSTEM TABLES (New Cooperative System)
// ========================================

export const raidDifficultyEnum = pgEnum("raid_difficulty", ["normal", "hard", "nightmare"]);
export const raidStatusEnum = pgEnum("raid_status", ["waiting", "in_progress", "completed", "failed", "expired"]);

// Raid Instances - Active raid rooms
export const raidInstances = pgTable("raid_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  leaderId: uuid("leader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  raidMapId: text("raid_map_id").notNull(),
  difficulty: raidDifficultyEnum("difficulty").notNull(),
  roomCode: text("room_code").notNull(),
  status: raidStatusEnum("status").notNull().default("waiting"),
  maxPlayers: integer("max_players").notNull().default(4),
  currentWave: integer("current_wave").notNull().default(0),
  battleState: jsonb("battle_state").$type<Record<string, unknown> | null>(),
  revivesUsed: integer("revives_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("raid_instances_room_code_unique").on(table.roomCode),
]);

// Raid Participants - Players in raid
export const raidInstanceParticipants = pgTable("raid_instance_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  raidInstanceId: uuid("raid_instance_id").notNull().references(() => raidInstances.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  isReady: boolean("is_ready").notNull().default(false),
  contribution: integer("contribution").notNull().default(0), // number of characters added
}, (table) => [
  uniqueIndex("raid_instance_participants_raid_user_unique").on(table.raidInstanceId, table.userId),
]);

// Raid Team Members - Characters in raid
export const raidTeamMembers = pgTable("raid_team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  raidInstanceId: uuid("raid_instance_id").notNull().references(() => raidInstances.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id").notNull().references(() => raidInstanceParticipants.id, { onDelete: "cascade" }),
  userCharacterId: uuid("user_character_id").notNull().references(() => userCharacters.id, { onDelete: "restrict" }),
  position: integer("position").notNull(), // 1-4
  isAlive: boolean("is_alive").notNull().default(true),
  currentHp: integer("current_hp").notNull(),
  damageDone: integer("damage_done").notNull().default(0),
}, (table) => [
  uniqueIndex("raid_team_members_raid_position_unique").on(table.raidInstanceId, table.position),
]);

// Raid Completions - History of cleared raids
export const raidCompletions = pgTable("raid_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  raidInstanceId: uuid("raid_instance_id").notNull().references(() => raidInstances.id, { onDelete: "cascade" }),
  raidMapId: text("raid_map_id").notNull(),
  difficulty: raidDifficultyEnum("difficulty").notNull(),
  participants: jsonb("participants").$type<Array<string>>().notNull(), // array of user IDs
  clearTime: integer("clear_time").notNull(), // in seconds
  totalDamage: integer("total_damage").notNull(),
  deathCount: integer("death_count").notNull(),
  rewards: jsonb("rewards").$type<Record<string, unknown>>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Raid Leaderboard - Best times per raid/difficulty
export const raidLeaderboard = pgTable("raid_leaderboard", {
  id: uuid("id").defaultRandom().primaryKey(),
  raidMapId: text("raid_map_id").notNull(),
  difficulty: raidDifficultyEnum("difficulty").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bestTime: integer("best_time").notNull(), // in seconds
  totalClears: integer("total_clears").notNull().default(1),
  fastestClearDate: timestamp("fastest_clear_date", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("raid_leaderboard_map_difficulty_user_unique").on(table.raidMapId, table.difficulty, table.userId),
]);

// Raid First Clears - Track first time completions for bonus rewards
export const raidFirstClears = pgTable("raid_first_clears", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  raidMapId: text("raid_map_id").notNull(),
  difficulty: raidDifficultyEnum("difficulty").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("raid_first_clears_user_map_difficulty_unique").on(table.userId, table.raidMapId, table.difficulty),
]);

export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type UserCharacter = typeof userCharacters.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type UserQuest = typeof userQuests.$inferSelect;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type Event = typeof events.$inferSelect;
export type UserEvent = typeof userEvents.$inferSelect;
export type Raid = typeof raids.$inferSelect;
export type RaidParticipant = typeof raidParticipants.$inferSelect;
export type PvpProfile = typeof pvpProfiles.$inferSelect;
export type PvpMatch = typeof pvpMatches.$inferSelect;
export type TowerProgress = typeof towerProgress.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type UserEquipment = typeof userEquipment.$inferSelect;
export type CharacterEquipped = typeof characterEquipped.$inferSelect;
export type LootBoxOpening = typeof lootBoxOpenings.$inferSelect;
export type LootBoxPity = typeof lootBoxPity.$inferSelect;
export type DailyFreeBox = typeof dailyFreeBox.$inferSelect;
export type MasteryXpInventory = typeof masteryXpInventory.$inferSelect;
export type RaidInstance = typeof raidInstances.$inferSelect;
export type RaidInstanceParticipant = typeof raidInstanceParticipants.$inferSelect;
export type RaidTeamMember = typeof raidTeamMembers.$inferSelect;
export type RaidCompletion = typeof raidCompletions.$inferSelect;
export type RaidLeaderboard = typeof raidLeaderboard.$inferSelect;
export type RaidFirstClear = typeof raidFirstClears.$inferSelect;

// =============================================
// BOSS RUSH TABLES
// =============================================

export const bossRushSeasons = pgTable("boss_rush_seasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bossRushRuns = pgTable("boss_rush_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  seasonId: uuid("season_id").notNull().references(() => bossRushSeasons.id, { onDelete: "cascade" }),
  bossesDefeated: integer("bosses_defeated").notNull().default(0),
  totalDamageDealt: integer("total_damage_dealt").notNull().default(0),
  completionTime: integer("completion_time").notNull().default(0), // em segundos
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardGems: integer("reward_gems").notNull().default(0),
  teamSnapshot: jsonb("team_snapshot").$type<Array<{ name: string; hp: number; maxHp: number }>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("boss_rush_runs_user_season_unique").on(table.userId, table.seasonId),
]);

export const bossRushLeaderboard = pgTable("boss_rush_leaderboard", {
  id: uuid("id").defaultRandom().primaryKey(),
  seasonId: uuid("season_id").notNull().references(() => bossRushSeasons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bossesDefeated: integer("bosses_defeated").notNull(),
  completionTime: integer("completion_time").notNull(),
  totalDamageDealt: integer("total_damage_dealt").notNull(),
  rank: integer("rank").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("boss_rush_leaderboard_season_user_unique").on(table.seasonId, table.userId),
]);

// =============================================
// ENHANCED PROFILE TABLES
// =============================================

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  bio: text("bio"),
  favoriteAnime: text("favorite_anime"),
  showcaseSlot1: uuid("showcase_slot_1").references(() => userCharacters.id, { onDelete: "set null" }),
  showcaseSlot2: uuid("showcase_slot_2").references(() => userCharacters.id, { onDelete: "set null" }),
  showcaseSlot3: uuid("showcase_slot_3").references(() => userCharacters.id, { onDelete: "set null" }),
  bannerCharacterId: uuid("banner_character_id").references(() => characters.id, { onDelete: "set null" }),
  profileColor: text("profile_color").default("#7289DA"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userBattleStats = pgTable("user_battle_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalBattles: integer("total_battles").notNull().default(0),
  totalVictories: integer("total_victories").notNull().default(0),
  totalDefeats: integer("total_defeats").notNull().default(0),
  arenaBattles: integer("arena_battles").notNull().default(0),
  arenaVictories: integer("arena_victories").notNull().default(0),
  pveBattles: integer("pve_battles").notNull().default(0),
  pveVictories: integer("pve_victories").notNull().default(0),
  raidBattles: integer("raid_battles").notNull().default(0),
  raidVictories: integer("raid_victories").notNull().default(0),
  bossRushBattles: integer("boss_rush_battles").notNull().default(0),
  bossRushVictories: integer("boss_rush_victories").notNull().default(0),
  highestDamageDealt: integer("highest_damage_dealt").notNull().default(0),
  totalDamageDealt: integer("total_damage_dealt").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characterUsageStats = pgTable("character_usage_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userCharacterId: uuid("user_character_id").notNull().references(() => userCharacters.id, { onDelete: "cascade" }),
  timesUsed: integer("times_used").notNull().default(0),
  battlesWon: integer("battles_won").notNull().default(0),
  battlesLost: integer("battles_lost").notNull().default(0),
  totalDamageDealt: integer("total_damage_dealt").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("character_usage_user_char_unique").on(table.userId, table.userCharacterId),
]);

// =============================================
// TUTORIAL SYSTEM
// =============================================

export const userTutorial = pgTable("user_tutorial", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStep: integer("current_step").notNull().default(0),
  completedSteps: text("completed_steps").array().notNull().default(sql`'{}'::text[]`),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  skipped: boolean("skipped").notNull().default(false),
  rewardsClaimed: jsonb("rewards_claimed").$type<Record<string, boolean>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
