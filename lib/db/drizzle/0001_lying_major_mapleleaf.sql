ALTER TABLE "user_characters" ADD COLUMN "mastery_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_characters" ADD COLUMN "mastery_xp" integer DEFAULT 0 NOT NULL;