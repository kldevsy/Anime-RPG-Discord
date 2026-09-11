-- Migration 0010: Tutorial System
-- Tabela para rastrear progresso do tutorial dos jogadores

CREATE TABLE IF NOT EXISTS "user_tutorial" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "current_step" INTEGER NOT NULL DEFAULT 0,
  "completed_steps" TEXT[] NOT NULL DEFAULT '{}',
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "skipped" BOOLEAN NOT NULL DEFAULT false,
  "rewards_claimed" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE("user_id")
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_user_tutorial_user_id" ON "user_tutorial"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_tutorial_current_step" ON "user_tutorial"("current_step");
CREATE INDEX IF NOT EXISTS "idx_user_tutorial_is_completed" ON "user_tutorial"("is_completed");

-- Comentários
COMMENT ON TABLE "user_tutorial" IS 'Rastreia progresso do tutorial interativo de novos jogadores';
COMMENT ON COLUMN "user_tutorial"."current_step" IS 'Step atual do tutorial (0-10)';
COMMENT ON COLUMN "user_tutorial"."completed_steps" IS 'Array de steps já completados (ex: [''step1'', ''step2''])';
COMMENT ON COLUMN "user_tutorial"."is_completed" IS 'Se o tutorial foi completado (todos os 10 steps)';
COMMENT ON COLUMN "user_tutorial"."skipped" IS 'Se o jogador pulou o tutorial';
COMMENT ON COLUMN "user_tutorial"."rewards_claimed" IS 'JSON com recompensas já reivindicadas por step';
