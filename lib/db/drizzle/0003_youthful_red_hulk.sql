CREATE TYPE "public"."loot_box_type" AS ENUM('basic', 'advanced', 'epic', 'legendary', 'mythic');--> statement-breakpoint
CREATE TABLE "daily_free_box" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"last_claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_free_box_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "loot_box_openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"box_type" "loot_box_type" NOT NULL,
	"gems_spent" integer NOT NULL,
	"rewards" jsonb NOT NULL,
	"jackpot" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loot_box_pity" (
	"user_id" uuid NOT NULL,
	"box_type" "loot_box_type" NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"last_rare_at" timestamp with time zone,
	CONSTRAINT "loot_box_pity_user_id_box_type_pk" PRIMARY KEY("user_id","box_type")
);
--> statement-breakpoint
CREATE TABLE "mastery_xp_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"accumulated_xp" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "mastery_xp_inventory_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "daily_free_box" ADD CONSTRAINT "daily_free_box_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loot_box_openings" ADD CONSTRAINT "loot_box_openings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loot_box_pity" ADD CONSTRAINT "loot_box_pity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_xp_inventory" ADD CONSTRAINT "mastery_xp_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;