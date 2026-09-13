#!/usr/bin/env node
/**
 * Discloud Startup Script
 * 
 * Este script:
 * 1. Compila o código TypeScript
 * 2. Aplica migrations do banco de dados
 * 3. Inicia o bot
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando Anime RPG Discord Bot...');
console.log('📁 Working directory:', process.cwd());

// 1. Verificar se existe artifacts/api-server
const apiServerPath = join(__dirname, 'artifacts', 'api-server');
if (!existsSync(apiServerPath)) {
  console.error('❌ Pasta artifacts/api-server não encontrada!');
  console.error('📂 Conteúdo da raiz:', execSync('ls -la', { encoding: 'utf8' }));
  process.exit(1);
}

console.log('✅ Pasta artifacts/api-server encontrada');

// 2. Instalar dependências do api-server (esbuild, etc)
console.log('📦 Instalando dependências do api-server...');
try {
  execSync('npm install --prefix artifacts/api-server', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Dependências instaladas!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

// 3. Compilar o código
console.log('🔨 Compilando código TypeScript...');
try {
  execSync('node artifacts/api-server/build.mjs', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Build concluído!');
} catch (error) {
  console.error('❌ Erro ao compilar:', error.message);
  process.exit(1);
}

// 4. Verificar se o build foi criado
const distPath = join(apiServerPath, 'dist', 'bot', 'index.mjs');
if (!existsSync(distPath)) {
  console.error('❌ Arquivo compilado não encontrado:', distPath);
  process.exit(1);
}

console.log('✅ Arquivo compilado encontrado');

// 5. Aplicar migrations (opcional, pode falhar se já aplicadas)
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

// 6. Iniciar o bot
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
