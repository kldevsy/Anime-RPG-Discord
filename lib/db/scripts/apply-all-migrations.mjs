import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

async function applyAllMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL não está definida!");
    console.error("Configure a variável de ambiente DATABASE_URL");
    process.exit(1);
  }

  console.log("🔄 Conectando ao banco de dados...");
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // ==========================================
    // MIGRATION 1: User Stats (0006)
    // ==========================================
    console.log("\n📄 [1/5] Aplicando migration: User Stats...");
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_battles_won integer NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_summons integer NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_pve_cleared integer NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_team_power integer NOT NULL DEFAULT 0;
      `);
      console.log("✅ User Stats aplicado!");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ User Stats já existe, pulando...");
      } else {
        throw err;
      }
    }

    // ==========================================
    // MIGRATION 2: Formation & Elements (0007)
    // ==========================================
    console.log("\n📄 [2/5] Aplicando migration: Formation & Elements...");
    try {
      // Criar enums se não existirem
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE element_type AS ENUM ('fire', 'water', 'electric', 'earth', 'wind', 'light', 'dark', 'neutral');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE position_type AS ENUM ('front', 'mid', 'back');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Adicionar colunas
      await pool.query(`
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS element element_type NOT NULL DEFAULT 'neutral';
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS default_position position_type NOT NULL DEFAULT 'mid';
        ALTER TABLE team_members ADD COLUMN IF NOT EXISTS battle_position position_type NOT NULL DEFAULT 'mid';
      `);

      console.log("✅ Formation & Elements aplicado!");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ Formation & Elements já existe, pulando...");
      } else {
        throw err;
      }
    }

    // ==========================================
    // MIGRATION 3: Boss Rush (0008)
    // ==========================================
    console.log("\n📄 [3/5] Aplicando migration: Boss Rush...");
    try {
      const migrationPath = resolve(__dirname, "../drizzle/0008_boss_rush.sql");
      const sql = readFileSync(migrationPath, "utf-8");
      await pool.query(sql);
      console.log("✅ Boss Rush aplicado!");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ Boss Rush já existe, pulando...");
      } else {
        throw err;
      }
    }

    // ==========================================
    // MIGRATION 4: Enhanced Profile (0009)
    // ==========================================
    console.log("\n📄 [4/5] Aplicando migration: Enhanced Profile...");
    try {
      const migrationPath = resolve(__dirname, "../drizzle/0009_enhanced_profile.sql");
      const sql = readFileSync(migrationPath, "utf-8");
      await pool.query(sql);
      console.log("✅ Enhanced Profile aplicado!");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ Enhanced Profile já existe, pulando...");
      } else {
        throw err;
      }
    }

    // ==========================================
    // MIGRATION 5: Character Banner URL (0011)
    // ==========================================
    console.log("\n📄 [5/5] Aplicando migration: Character Banner URL...");
    try {
      await pool.query(`
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS banner_url text;
      `);
      console.log("✅ Character Banner URL aplicado!");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ Character Banner URL já existe, pulando...");
      } else {
        throw err;
      }
    }

    // ==========================================
    // SUCESSO
    // ==========================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 TODAS AS MIGRATIONS APLICADAS COM SUCESSO!");
    console.log("=".repeat(50));
    console.log("\n📊 Funcionalidades ativas:");
    console.log("  ✅ User Stats (ranking melhorado)");
    console.log("  ✅ Formation System (elementos, posições, counters)");
    console.log("  ✅ Boss Rush (5 bosses consecutivos)");
    console.log("  ✅ Enhanced Profile (showcase, stats, banner)");
    console.log("  ✅ Character Banner URL (banners widescreen 16:9)");
    console.log("\n🎮 Novos comandos disponíveis:");
    console.log("  /perfil ver - Perfil completo com stats");
    console.log("  /perfil showcase - 3 personagens favoritos");
    console.log("  /perfil banner - Banner customizado");
    console.log("  /bossrush iniciar - Boss Rush mode");
    console.log("  /bossrush ranking - Leaderboard semanal");
    console.log("  /invocar - Agora mostra banners widescreen");
    console.log("  /personagem - Exibe banner + avatar do personagem");
    console.log("\n💡 Próximo passo: Reiniciar o bot");
    console.log("  (O bot já deve estar rodando com as novas features)");

  } catch (error) {
    console.error("\n❌ Erro ao aplicar migrations:", error.message);
    console.error("\nDetalhes:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyAllMigrations();
