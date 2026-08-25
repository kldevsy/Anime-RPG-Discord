CREATE TABLE IF NOT EXISTS "user_pve_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "stage_id" uuid NOT NULL,
  "cleared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_pve_progress"
  ADD CONSTRAINT "user_pve_progress_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_pve_progress"
  ADD CONSTRAINT "user_pve_progress_stage_id_pve_stages_id_fk"
  FOREIGN KEY ("stage_id") REFERENCES "public"."pve_stages"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_pve_progress_user_stage_unique"
  ON "user_pve_progress" USING btree ("user_id", "stage_id");