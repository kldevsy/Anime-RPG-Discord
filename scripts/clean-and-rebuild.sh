#!/bin/bash
# Script para limpar código antigo e fazer rebuild completo

echo "🧹 Limpando código antigo..."

# Remover arquivos JavaScript antigos (se existirem)
rm -rf utils
rm -rf commands
rm -f index.js

# Remover build antigo
rm -rf artifacts/api-server/dist

echo "✅ Código antigo removido"
echo ""
echo "🔨 Fazendo rebuild..."

# Rebuild
cd artifacts/api-server
node build.mjs
cd ../..

echo ""
echo "✅ Rebuild completo!"
echo ""
echo "📊 Verificando build..."
ls -la artifacts/api-server/dist/

echo ""
echo "🎉 Pronto! Agora reinicie o bot no Replit (Stop + Run)"
