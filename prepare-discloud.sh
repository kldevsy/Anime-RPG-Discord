#!/bin/bash
# Script para preparar deploy na Discloud

echo "🚀 Preparando deploy para Discloud..."
echo ""

# 1. Instalar dependências
echo "📦 [1/4] Instalando dependências..."
pnpm install

# 2. Aplicar migrations
echo "📊 [2/4] Aplicando migrations do banco de dados..."
node lib/db/scripts/apply-all-migrations.mjs

# 3. Build do projeto
echo "🔨 [3/4] Compilando TypeScript..."
cd artifacts/api-server
node build.mjs
cd ../..

# 4. Verificar arquivos necessários
echo "✅ [4/4] Verificando arquivos..."
if [ -f "discloud.config" ]; then
    echo "✅ discloud.config encontrado"
else
    echo "❌ discloud.config não encontrado!"
    exit 1
fi

if [ -f "artifacts/api-server/dist/bot/index.mjs" ]; then
    echo "✅ Bot compilado com sucesso"
else
    echo "❌ Erro ao compilar bot!"
    exit 1
fi

echo ""
echo "🎉 Projeto pronto para deploy na Discloud!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente (.env):"
echo "   - DISCORD_TOKEN"
echo "   - DISCORD_CLIENT_ID"
echo "   - DATABASE_URL"
echo ""
echo "2. Faça upload do projeto para Discloud:"
echo "   - Acesse: https://discloud.app"
echo "   - Faça upload do ZIP do projeto"
echo "   - Configure as variáveis de ambiente"
echo ""
echo "3. Seu bot estará online em alguns minutos! 🎮"
