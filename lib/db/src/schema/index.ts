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

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  gold: integer("gold").notNull().default(0),
  gems: integer("gems").notNull().default(0),
  tickets: integer("tickets").notNull().default(0),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type UserCharacter = typeof userCharacters.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;