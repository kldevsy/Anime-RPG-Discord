-- Safe migrations: cria tipos apenas se não existirem
DO $$ BEGIN
  CREATE TYPE "public"."banner_type" AS ENUM('normal', 'limited', 'event');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."battle_status" AS ENUM('running', 'victory', 'defeat', 'draw');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."currency" AS ENUM('gold', 'gems', 'tickets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."pve_type" AS ENUM('story', 'dungeon', 'boss', 'tower', 'event', 'raid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."quest_category" AS ENUM('daily', 'weekly', 'monthly', 'story', 'event');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."character_rarity" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."character_role" AS ENUM('tank', 'dps', 'support', 'healer', 'control');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
