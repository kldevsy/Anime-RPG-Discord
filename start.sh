#!/bin/bash
# Script de início rápido para o bot Discord

echo "🚀 ===== ANIME RPG DISCORD BOT ====="
echo ""

# Função para aplicar migrations
apply_migrations() {
  echo "📊 [1/3] Aplicando migrations..."
  node lib/db/scripts/apply-all-migrations.mjs
  if [ $? -ne 0 ]; then
    echo "⚠️ Migrations falharam ou já aplicadas"
  fi
  echo ""
}

# Função para build
build_bot() {
  echo "🔨 [2/3] Compilando código..."
  cd artifacts/api-server
  node build.mjs
  if [ $? -ne 0 ]; then
    echo "❌ Build falhou!"
    exit 1
  fi
  cd ../..
  echo ""
}

# Função para iniciar bot
start_bot() {
  echo "🤖 [3/3] Iniciando bot..."
  echo ""
  cd artifacts/api-server
  node --enable-source-maps ./dist/bot/index.mjs
}

# Verificar argumento
case "$1" in
  quick)
    echo "⚡ Modo Quick Restart (sem build)"
    echo ""
    start_bot
    ;;
  build)
    echo "🔨 Modo Build Only"
    echo ""
    build_bot
    ;;
  migrate)
    echo "📊 Modo Migration Only"
    echo ""
    apply_migrations
    ;;
  *)
    echo "🔄 Modo Full (migrations + build + start)"
    echo ""
    apply_migrations
    build_bot
    start_bot
    ;;
esac
