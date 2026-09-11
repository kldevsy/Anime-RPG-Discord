-- Enhanced Profile System Migration

-- User Profiles (showcase, banner, customization)
CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE UNIQUE,
  "bio" text,
  "favorite_anime" text,
  "showcase_slot_1" uuid REFERENCES "user_characters"("id") ON DELETE SET NULL,
  "showcase_slot_2" uuid REFERENCES "user_characters"("id") ON DELETE SET NULL,
  "showcase_slot_3" uuid REFERENCES "user_characters"("id") ON DELETE SET NULL,
  "banner_character_id" uuid REFERENCES "characters"("id") ON DELETE SET NULL,
  "profile_color" text DEFAULT '#7289DA',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Battle Statistics (win rate, battles by mode)
CREATE TABLE IF NOT EXISTS "user_battle_stats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE UNIQUE,
  "total_battles" integer DEFAULT 0 NOT NULL,
  "total_victories" integer DEFAULT 0 NOT NULL,
  "total_defeats" integer DEFAULT 0 NOT NULL,
  "arena_battles" integer DEFAULT 0 NOT NULL,
  "arena_victories" integer DEFAULT 0 NOT NULL,
  "pve_battles" integer DEFAULT 0 NOT NULL,
  "pve_victories" integer DEFAULT 0 NOT NULL,
  "raid_battles" integer DEFAULT 0 NOT NULL,
  "raid_victories" integer DEFAULT 0 NOT NULL,
  "boss_rush_battles" integer DEFAULT 0 NOT NULL,
  "boss_rush_victories" integer DEFAULT 0 NOT NULL,
  "highest_damage_dealt" integer DEFAULT 0 NOT NULL,
  "total_damage_dealt" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Character Usage Statistics (most used characters)
CREATE TABLE IF NOT EXISTS "character_usage_stats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "user_character_id" uuid NOT NULL REFERENCES "user_characters"("id") ON DELETE CASCADE,
  "times_used" integer DEFAULT 0 NOT NULL,
  "battles_won" integer DEFAULT 0 NOT NULL,
  "battles_lost" integer DEFAULT 0 NOT NULL,
  "total_damage_dealt" integer DEFAULT 0 NOT NULL,
  "last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS "character_usage_user_char_unique" ON "character_usage_stats" ("user_id", "user_character_id");

-- Criar perfis e stats para usuários existentes
INSERT INTO "user_profiles" ("user_id")
SELECT "id" FROM "users"
ON CONFLICT ("user_id") DO NOTHING;

INSERT INTO "user_battle_stats" ("user_id")
SELECT "id" FROM "users"
ON CONFLICT ("user_id") DO NOTHING;
