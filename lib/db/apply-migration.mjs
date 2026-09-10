import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const db = drizzle(pool);

try {
  console.log('Aplicando migration 0006_add_user_stats...');
  
  await db.execute(sql.raw('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_battles_won integer NOT NULL DEFAULT 0'));
  console.log('✅ total_battles_won');
  
  await db.execute(sql.raw('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_summons integer NOT NULL DEFAULT 0'));
  console.log('✅ total_summons');
  
  await db.execute(sql.raw('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_pve_cleared integer NOT NULL DEFAULT 0'));
  console.log('✅ total_pve_cleared');
  
  await db.execute(sql.raw('ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_team_power integer NOT NULL DEFAULT 0'));
  console.log('✅ highest_team_power');
  
  console.log('\n🎉 Migration aplicada com sucesso!');
} catch (error) {
  console.error('❌ Erro ao aplicar migration:', error.message);
  process.exit(1);
} finally {
  await pool.end();
  process.exit(0);
}
