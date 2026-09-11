import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

async function applyMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL não está definida!");
    console.error("Configure a variável de ambiente DATABASE_URL");
    process.exit(1);
  }

  console.log("🔄 Conectando ao banco de dados...");
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Ler arquivo SQL
    const migrationPath = resolve(__dirname, "../drizzle/0008_boss_rush.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("📄 Aplicando migration 0008_boss_rush.sql...");

    // Executar migration
    await pool.query(sql);

    console.log("✅ Migration Boss Rush aplicada com sucesso!");
    console.log("\n📊 Tabelas criadas:");
    console.log("  • boss_rush_seasons");
    console.log("  • boss_rush_runs");
    console.log("  • boss_rush_leaderboard");
    console.log("\n🎮 Temporada inicial criada automaticamente!");
    console.log("\n💡 Agora você pode usar:");
    console.log("  /bossrush iniciar");
    console.log("  /bossrush ranking");
    console.log("  /bossrush info");

  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    
    if (error.message.includes("already exists")) {
      console.log("\n⚠️ Tabelas já existem! Migration já foi aplicada anteriormente.");
    } else {
      console.error("\nDetalhes do erro:", error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

applyMigration();
