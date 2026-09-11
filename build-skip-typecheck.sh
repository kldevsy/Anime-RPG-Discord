#!/bin/bash
# Build direto ignorando typecheck

echo "🔨 Building sem typecheck..."
cd artifacts/api-server
pnpm run build

if [ $? -eq 0 ]; then
  echo "✅ Build completo!"
  echo "🚀 Iniciando bot..."
  pnpm run bot
else
  echo "❌ Build falhou"
  exit 1
fi
