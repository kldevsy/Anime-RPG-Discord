-- Boss Rush System Migration

-- Temporadas de Boss Rush
CREATE TABLE IF NOT EXISTS "boss_rush_seasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone NOT NULL,
  "active" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Runs de Boss Rush (tentativas do jogador)
CREATE TABLE IF NOT EXISTS "boss_rush_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "season_id" uuid NOT NULL REFERENCES "boss_rush_seasons"("id") ON DELETE CASCADE,
  "bosses_defeated" integer DEFAULT 0 NOT NULL,
  "total_damage_dealt" integer DEFAULT 0 NOT NULL,
  "completion_time" integer DEFAULT 0 NOT NULL,
  "reward_gold" integer DEFAULT 0 NOT NULL,
  "reward_gems" integer DEFAULT 0 NOT NULL,
  "team_snapshot" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Leaderboard semanal
CREATE TABLE IF NOT EXISTS "boss_rush_leaderboard" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid NOT NULL REFERENCES "boss_rush_seasons"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bosses_defeated" integer NOT NULL,
  "completion_time" integer NOT NULL,
  "total_damage_dealt" integer NOT NULL,
  "rank" integer NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS "boss_rush_runs_user_season_unique" ON "boss_rush_runs" ("user_id", "season_id");
CREATE UNIQUE INDEX IF NOT EXISTS "boss_rush_leaderboard_season_user_unique" ON "boss_rush_leaderboard" ("season_id", "user_id");
CREATE INDEX IF NOT EXISTS "boss_rush_leaderboard_season_rank_idx" ON "boss_rush_leaderboard" ("season_id", "rank");

-- Inserir temporada inicial (semanal)
INSERT INTO "boss_rush_seasons" ("name", "start_date", "end_date", "active")
VALUES (
  'Temporada 1',
  now(),
  now() + interval '7 days',
  1
)
ON CONFLICT DO NOTHING;
