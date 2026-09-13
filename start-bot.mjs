#!/usr/bin/env node
/**
 * Discloud Startup Script (Simplified)
 * 
 * Este script apenas inicia o bot pré-compilado.
 * O build é feito no Replit antes do deploy.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando Anime RPG Discord Bot...');
console.log('📁 Working directory:', process.cwd());

// 1. Verificar se o build existe
const distPath = join(__dirname, 'artifacts', 'api-server', 'dist', 'bot', 'index.mjs');
if (!existsSync(distPath)) {
  console.error('❌ Build não encontrado:', distPath);
  console.error('💡 Dica: Faça o build no Replit antes de fazer deploy!');
  console.error('📂 Conteúdo:', execSync('ls -la artifacts/api-server/ || echo "pasta não encontrada"', { encoding: 'utf8' }));
  process.exit(1);
}

console.log('✅ Build encontrado!');

// 2. Aplicar migrations (opcional, pode falhar se já aplicadas)
console.log('📊 Aplicando migrations do banco de dados...');
try {
  execSync('node lib/db/scripts/apply-all-migrations.mjs', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Migrations aplicadas!');
} catch (error) {
  console.warn('⚠️  Aviso ao aplicar migrations (pode ser normal):', error.message);
}

// 3. Iniciar o bot
console.log('🤖 Iniciando bot...');
console.log('');

try {
  execSync('node --enable-source-maps artifacts/api-server/dist/bot/index.mjs', {
    cwd: __dirname,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('❌ Erro ao iniciar bot:', error.message);
  process.exit(1);
}
