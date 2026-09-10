CREATE TYPE "public"."raid_difficulty" AS ENUM('normal', 'hard', 'nightmare');--> statement-breakpoint
CREATE TYPE "public"."raid_status" AS ENUM('waiting', 'in_progress', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "raid_instance_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_instance_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"contribution" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raid_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leader_id" uuid NOT NULL,
	"raid_map_id" text NOT NULL,
	"difficulty" "raid_difficulty" NOT NULL,
	"room_code" text NOT NULL,
	"status" "raid_status" DEFAULT 'waiting' NOT NULL,
	"max_players" integer DEFAULT 4 NOT NULL,
	"current_wave" integer DEFAULT 0 NOT NULL,
	"battle_state" jsonb,
	"revives_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "raid_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_instance_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"user_character_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"is_alive" boolean DEFAULT true NOT NULL,
	"current_hp" integer NOT NULL,
	"damage_done" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "raid_instance_participants" ADD CONSTRAINT "raid_instance_participants_raid_instance_id_raid_instances_id_fk" FOREIGN KEY ("raid_instance_id") REFERENCES "public"."raid_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_instance_participants" ADD CONSTRAINT "raid_instance_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_instances" ADD CONSTRAINT "raid_instances_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_team_members" ADD CONSTRAINT "raid_team_members_raid_instance_id_raid_instances_id_fk" FOREIGN KEY ("raid_instance_id") REFERENCES "public"."raid_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_team_members" ADD CONSTRAINT "raid_team_members_participant_id_raid_instance_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."raid_instance_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raid_team_members" ADD CONSTRAINT "raid_team_members_user_character_id_user_characters_id_fk" FOREIGN KEY ("user_character_id") REFERENCES "public"."user_characters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "raid_instance_participants_raid_user_unique" ON "raid_instance_participants" USING btree ("raid_instance_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "raid_instances_room_code_unique" ON "raid_instances" USING btree ("room_code");--> statement-breakpoint
CREATE UNIQUE INDEX "raid_team_members_raid_position_unique" ON "raid_team_members" USING btree ("raid_instance_id","position");