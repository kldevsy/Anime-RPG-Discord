CREATE TYPE "public"."banner_type" AS ENUM('normal', 'limited', 'event');--> statement-breakpoint
CREATE TYPE "public"."battle_status" AS ENUM('running', 'victory', 'defeat', 'draw');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('gold', 'gems', 'tickets');--> statement-breakpoint
CREATE TYPE "public"."pve_type" AS ENUM('story', 'dungeon', 'boss', 'tower', 'event', 'raid');--> statement-breakpoint
CREATE TYPE "public"."quest_category" AS ENUM('daily', 'weekly', 'monthly', 'story', 'event');--> statement-breakpoint
CREATE TYPE "public"."character_rarity" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic');--> statement-breakpoint
CREATE TYPE "public"."character_role" AS ENUM('tank', 'dps', 'support', 'healer', 'control');--> statement-breakpoint
CREATE TABLE "banner_pity" (
	"user_id" uuid NOT NULL,
	"banner_id" uuid NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "banner_pity_user_id_banner_id_pk" PRIMARY KEY("user_id","banner_id")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "banner_type" NOT NULL,
	"cost_currency" "currency" DEFAULT 'tickets' NOT NULL,
	"single_cost" integer DEFAULT 1 NOT NULL,
	"ten_cost" integer DEFAULT 10 NOT NULL,
	"rates" jsonb NOT NULL,
	"soft_pity_start" integer DEFAULT 70 NOT NULL,
	"hard_pity" integer DEFAULT 90 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"actor_id" text NOT NULL,
	"action_type" text NOT NULL,
	"target_id" text,
	"amount" integer,
	"critical" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"turn" integer NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "battle_status" NOT NULL,
	"round" integer NOT NULL,
	"rewards" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anime" text NOT NULL,
	"name" text NOT NULL,
	"rarity" character_rarity NOT NULL,
	"role" character_role NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"base_hp" integer NOT NULL,
	"base_attack" integer NOT NULL,
	"base_defense" integer NOT NULL,
	"base_speed" integer NOT NULL,
	"image_url" text,
	"passive" text,
	"ultimate" jsonb,
	"evolution" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_rewards_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "economy_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"reference_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"enemy_name" text NOT NULL,
	"enemy_hp" integer NOT NULL,
	"enemy_attack" integer NOT NULL,
	"enemy_defense" integer NOT NULL,
	"enemy_speed" integer NOT NULL,
	"reward_gold" integer DEFAULT 0 NOT NULL,
	"reward_gems" integer DEFAULT 0 NOT NULL,
	"reward_tickets" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_key" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pve_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "pve_type" DEFAULT 'story' NOT NULL,
	"position" integer NOT NULL,
	"enemy_name" text NOT NULL,
	"enemy_hp" integer NOT NULL,
	"enemy_attack" integer NOT NULL,
	"enemy_defense" integer NOT NULL,
	"enemy_speed" integer NOT NULL,
	"boss_phases" integer DEFAULT 1 NOT NULL,
	"enrage_round" integer DEFAULT 10 NOT NULL,
	"drops" jsonb DEFAULT '[]'::jsonb,
	"reward_gold" integer DEFAULT 0 NOT NULL,
	"reward_xp" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pve_worlds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"position" integer NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pve_worlds_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "pvp_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenger_id" uuid NOT NULL,
	"defender_id" uuid NOT NULL,
	"winner_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"rating_change" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pvp_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer DEFAULT 1000 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pvp_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "quest_category" NOT NULL,
	"requirement_type" text NOT NULL,
	"requirement_count" integer NOT NULL,
	"reward_gold" integer DEFAULT 0 NOT NULL,
	"reward_gems" integer DEFAULT 0 NOT NULL,
	"reward_tickets" integer DEFAULT 0 NOT NULL,
	"reward_items" jsonb DEFAULT '[]'::jsonb,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raid_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"damage_dealt" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"boss_name" text NOT NULL,
	"current_hp" integer NOT NULL,
	"max_hp" integer NOT NULL,
	"boss_attack" integer NOT NULL,
	"boss_defense" integer NOT NULL,
	"boss_speed" integer NOT NULL,
	"boss_phases" integer DEFAULT 1 NOT NULL,
	"enrage_round" integer DEFAULT 10 NOT NULL,
	"reward_gold" integer DEFAULT 0 NOT NULL,
	"reward_gems" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"banner_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"results" jsonb NOT NULL,
	"currency" "currency" NOT NULL,
	"cost" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "summons_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" uuid NOT NULL,
	"user_character_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "team_members_team_id_user_character_id_pk" PRIMARY KEY("team_id","user_character_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT 'Equipe principal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tower_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"highest_floor" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tower_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"claimed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_pve_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"cleared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"claimed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_id" text NOT NULL,
	"username" text NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"gems" integer DEFAULT 1000 NOT NULL,
	"tickets" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
ALTER TABLE "banner_pity" ADD CONSTRAINT "banner_pity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_pity" ADD CONSTRAINT "banner_pity_banner_id_banners_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_actions" ADD CONSTRAINT "battle_actions_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_snapshots" ADD CONSTRAINT "battle_snapshots_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_rewards" ADD CONSTRAINT "daily_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "economy_transactions" ADD CONSTRAINT "economy_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pve_stages" ADD CONSTRAINT "pve_stages_world_id_pve_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."pve_worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pvp_matches" ADD CONSTRAINT "pvp_matches_challenger_id_users_id_fk" FOREIGN KEY ("challenger_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pvp_matches" ADD CONSTRAINT "pvp_matches_defender_id_users_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pvp_matches" ADD CONSTRAINT "pvp_matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pvp_profiles" ADD CONSTRAINT "pvp_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_participants" ADD CONSTRAINT "raid_participants_raid_id_raids_id_fk" FOREIGN KEY ("raid_id") REFERENCES "public"."raids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_participants" ADD CONSTRAINT "raid_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summons" ADD CONSTRAINT "summons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summons" ADD CONSTRAINT "summons_banner_id_banners_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."banners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_character_id_user_characters_id_fk" FOREIGN KEY ("user_character_id") REFERENCES "public"."user_characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tower_progress" ADD CONSTRAINT "tower_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pve_progress" ADD CONSTRAINT "user_pve_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pve_progress" ADD CONSTRAINT "user_pve_progress_stage_id_pve_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pve_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "characters_anime_name_unique" ON "characters" USING btree ("anime","name");--> statement-breakpoint
CREATE UNIQUE INDEX "economy_transactions_reference_unique" ON "economy_transactions" USING btree ("reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_user_item_unique" ON "inventory" USING btree ("user_id","item_key");--> statement-breakpoint
CREATE UNIQUE INDEX "raid_participants_raid_user_unique" ON "raid_participants" USING btree ("raid_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_position_unique" ON "team_members" USING btree ("team_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_user_name_unique" ON "teams" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_characters_user_character_unique" ON "user_characters" USING btree ("user_id","character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_events_user_event_unique" ON "user_events" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_pve_progress_user_stage_unique" ON "user_pve_progress" USING btree ("user_id","stage_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_quests_user_quest_unique" ON "user_quests" USING btree ("user_id","quest_id");