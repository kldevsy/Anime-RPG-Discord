ALTER TABLE "pve_stages"
  ADD COLUMN IF NOT EXISTS "boss_phases" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "pve_stages"
  ADD COLUMN IF NOT EXISTS "enrage_round" integer DEFAULT 10 NOT NULL;
--> statement-breakpoint
ALTER TABLE "pve_stages"
  ADD COLUMN IF NOT EXISTS "drops" jsonb DEFAULT '[]'::jsonb;