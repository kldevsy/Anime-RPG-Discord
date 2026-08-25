import { createInsertSchema } from "drizzle-zod";
import {
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

export const rarityEnum = pgEnum("character_rarity", [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
]);

export const roleEnum = pgEnum("character_role", [
  "tank",
  "dps",
  "support",
  "healer",
  "control",
]);
export const bannerTypeEnum = pgEnum("banner_type", ["normal", "limited", "event"]);
export const currencyEnum = pgEnum("currency", ["gold", "gems", "tickets"]);
export const battleStatusEnum = pgEnum("battle_status", ["running", "victory", "defeat", "draw"]);
export const pveTypeEnum = pgEnum("pve_type", ["story", "dungeon", "boss", "tower", "event", "raid"]);
export const questCategoryEnum = pgEnum("quest_category", ["daily", "weekly", "monthly", "story", "event"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  gold: integer("gold").notNull().default(0),
  gems: integer("gems").notNull().default(1000),
  tickets: integer("tickets").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  anime: text("anime").notNull(),
  name: text("name").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  role: roleEnum("role").notNull(),
  level: integer("level").notNull().default(1),
  baseHp: integer("base_hp").notNull(),
  baseAttack: integer("base_attack").notNull(),
  baseDefense: integer("base_defense").notNull(),
  baseSpeed: integer("base_speed").notNull(),
  imageUrl: text("image_url"),
  passive: text("passive"),
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
  results: jsonb("results").$type<Array<{ characterId: string; ownedId: string; name: string; anime: string; rarity: string; imageUrl: string | null }>>().notNull(),
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
