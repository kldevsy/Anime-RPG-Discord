CREATE TYPE "public"."pve_type" AS ENUM('story', 'dungeon', 'boss', 'tower', 'event', 'raid');--> statement-breakpoint
CREATE TABLE "pve_worlds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "position" integer NOT NULL,
  "active" integer DEFAULT 1 NOT NULL,
  CONSTRAINT "pve_worlds_name_unique" UNIQUE("name")
);--> statement-breakpoint
CREATE TABLE "pve_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "world_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" "pve_type" DEFAULT 'story' NOT NULL,
  "position" integer NOT NULL,
  "enemy_name" text NOT NULL,
  "enemy_hp" integer NOT NULL,
  "enemy_attack" integer NOT NULL,
  "enemy_defense" integer NOT NULL,
  "enemy_speed" integer NOT NULL,
  "boss_phases" integer DEFAULT 1 NOT NULL,
  "enrage_round" integer DEFAULT 10 NOT NULL,
  "drops" jsonb DEFAULT '[]'::jsonb,
  "reward_gold" integer DEFAULT 0 NOT NULL,
  "reward_xp" integer DEFAULT 0 NOT NULL,
  "active" integer DEFAULT 1 NOT NULL
);--> statement-breakpoint
CREATE TABLE "user_pve_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "stage_id" uuid NOT NULL,
  "cleared_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "pve_stages" ADD CONSTRAINT "pve_stages_world_id_pve_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."pve_worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pve_progress" ADD CONSTRAINT "user_pve_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pve_progress" ADD CONSTRAINT "user_pve_progress_stage_id_pve_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pve_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_pve_progress_user_stage_unique" ON "user_pve_progress" USING btree ("user_id", "stage_id");--> statement-breakpoint
INSERT INTO "pve_worlds" ("id", "name", "description", "position", "active") VALUES
  ('10000000-0000-4000-8000-000000000001', 'Mundo 1: País das Ondas', 'A primeira aventura no mundo dos ninjas.', 1, 1),
  ('10000000-0000-4000-8000-000000000002', 'Mundo 2: Grand Line', 'A perigosa rota dos piratas.', 2, 1),
  ('10000000-0000-4000-8000-000000000003', 'Masmorra Elemental', 'Cavernas cheias de monstros e tesouros.', 3, 1),
  ('10000000-0000-4000-8000-000000000004', 'Torre do Desafio', 'Andares infinitos para testar sua força.', 4, 1),
  ('10000000-0000-4000-8000-000000000005', 'Raid de Chefes', 'Inimigos lendários de poder extremo.', 5, 1),
  ('10000000-0000-4000-8000-000000000006', 'Invasão de Evento', 'Eventos temporários com recompensas exclusivas.', 6, 1)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "pve_stages" ("id", "world_id", "name", "type", "position", "enemy_name", "enemy_hp", "enemy_attack", "enemy_defense", "enemy_speed", "boss_phases", "enrage_round", "drops", "reward_gold", "reward_xp", "active") VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Fronteira das Ondas', 'story', 1, 'Bandido das Sombras', 400, 80, 40, 90, 1, 10, '[]'::jsonb, 100, 50, 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Estrada da Floresta', 'story', 2, 'Ninjutsu Rogue', 650, 110, 60, 100, 1, 10, '[]'::jsonb, 150, 80, 1),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Confronto na Ponte (Boss)', 'boss', 3, 'Zabuza Demon', 1800, 170, 85, 115, 2, 8, '[{"itemKey":"gems","quantity":50,"chance":100}]'::jsonb, 500, 300, 1),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'Vila dos Conchas', 'story', 1, 'Marinheiro Corrupto', 800, 120, 70, 95, 1, 10, '[]'::jsonb, 200, 100, 1),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'Parque Arlong (Boss)', 'boss', 2, 'Arlong dos Homens-Peixe', 3200, 220, 110, 105, 2, 10, '[{"itemKey":"tickets","quantity":2,"chance":100}]'::jsonb, 800, 500, 1),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'Caverna Elemental', 'dungeon', 1, 'Dragão de Pedra', 4000, 240, 130, 100, 2, 8, '[{"itemKey":"gems","quantity":80,"chance":100}]'::jsonb, 1000, 600, 1),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000004', 'Torre Andar 10', 'tower', 1, 'Golem de Energia', 2800, 200, 120, 100, 1, 10, '[{"itemKey":"gems","quantity":30,"chance":100}]'::jsonb, 700, 450, 1),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000005', 'Raid: Kurama', 'raid', 1, 'Kurama Nove Caudas', 9000, 340, 160, 120, 3, 6, '[{"itemKey":"gems","quantity":200,"chance":100},{"itemKey":"tickets","quantity":5,"chance":100}]'::jsonb, 2500, 1500, 1),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000006', 'Espectro da Primavera', 'event', 1, 'Espírito de Sakura', 1800, 150, 80, 105, 1, 10, '[{"itemKey":"tickets","quantity":1,"chance":100}]'::jsonb, 400, 250, 1)
ON CONFLICT ("id") DO NOTHING;
