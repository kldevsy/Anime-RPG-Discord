CREATE TYPE "public"."equipable_type" AS ENUM('character', 'role', 'universal');--> statement-breakpoint
CREATE TABLE "character_equipped" (
	"user_character_id" uuid PRIMARY KEY NOT NULL,
	"user_equipment_id" uuid,
	CONSTRAINT "character_equipped_user_equipment_id_unique" UNIQUE("user_equipment_id")
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"rarity" character_rarity NOT NULL,
	"description" text NOT NULL,
	"equipable_type" "equipable_type" NOT NULL,
	"equipable_target" text,
	"bonus_hp" integer DEFAULT 0 NOT NULL,
	"bonus_attack" integer DEFAULT 0 NOT NULL,
	"bonus_defense" integer DEFAULT 0 NOT NULL,
	"bonus_speed" integer DEFAULT 0 NOT NULL,
	"bonus_crit_chance" integer DEFAULT 0 NOT NULL,
	"bonus_crit_damage" integer DEFAULT 0 NOT NULL,
	"passive_ability" jsonb,
	"image_url" text,
	"catalog_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_equipped" ADD CONSTRAINT "character_equipped_user_character_id_user_characters_id_fk" FOREIGN KEY ("user_character_id") REFERENCES "public"."user_characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_equipped" ADD CONSTRAINT "character_equipped_user_equipment_id_user_equipment_id_fk" FOREIGN KEY ("user_equipment_id") REFERENCES "public"."user_equipment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_equipment" ADD CONSTRAINT "user_equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_equipment" ADD CONSTRAINT "user_equipment_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_name_unique" ON "equipment" USING btree ("name");