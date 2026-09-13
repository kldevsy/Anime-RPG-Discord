# Rebuild após fix do sql import
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   REBUILD + COMMIT FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔨 Fazendo rebuild..." -ForegroundColor Yellow
cd artifacts/api-server
node build.mjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro ao compilar!" -ForegroundColor Red
    cd ../..
    exit 1
}

cd ../..
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Commitando..." -ForegroundColor Yellow
git add lib/db/src/schema/index.ts artifacts/api-server/dist/
git commit -m "Fix: adicionar import sql no schema (tutorial system)"
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ PRONTO PARA DEPLOY FINAL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Erro corrigido:" -ForegroundColor Cyan
Write-Host "  ✓ import { sql } from 'drizzle-orm' adicionado" -ForegroundColor Gray
Write-Host "  ✓ Build atualizado" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Baixe novo ZIP do GitHub" -ForegroundColor White
Write-Host "  2. Upload no Discloud" -ForegroundColor White
Write-Host "  3. Bot vai iniciar! 🚀" -ForegroundColor Green
