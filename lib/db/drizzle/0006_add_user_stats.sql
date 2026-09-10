-- Add user statistics fields
ALTER TABLE "users" ADD COLUMN "total_battles_won" integer NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "total_summons" integer NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "total_pve_cleared" integer NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "highest_team_power" integer NOT NULL DEFAULT 0;
