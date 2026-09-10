CREATE TABLE "raid_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_instance_id" uuid NOT NULL,
	"raid_map_id" text NOT NULL,
	"difficulty" "raid_difficulty" NOT NULL,
	"participants" jsonb NOT NULL,
	"clear_time" integer NOT NULL,
	"total_damage" integer NOT NULL,
	"death_count" integer NOT NULL,
	"rewards" jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raid_first_clears" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"raid_map_id" text NOT NULL,
	"difficulty" "raid_difficulty" NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raid_leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_map_id" text NOT NULL,
	"difficulty" "raid_difficulty" NOT NULL,
	"user_id" uuid NOT NULL,
	"best_time" integer NOT NULL,
	"total_clears" integer DEFAULT 1 NOT NULL,
	"fastest_clear_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "raid_completions" ADD CONSTRAINT "raid_completions_raid_instance_id_raid_instances_id_fk" FOREIGN KEY ("raid_instance_id") REFERENCES "public"."raid_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_first_clears" ADD CONSTRAINT "raid_first_clears_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_leaderboard" ADD CONSTRAINT "raid_leaderboard_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "raid_first_clears_user_map_difficulty_unique" ON "raid_first_clears" USING btree ("user_id","raid_map_id","difficulty");--> statement-breakpoint
CREATE UNIQUE INDEX "raid_leaderboard_map_difficulty_user_unique" ON "raid_leaderboard" USING btree ("raid_map_id","difficulty","user_id");