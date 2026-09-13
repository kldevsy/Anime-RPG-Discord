# Script completo: Build + Commit + Deploy
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BUILD E DEPLOY PARA DISCLOUD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Fazer build
Write-Host "🔨 Compilando código..." -ForegroundColor Yellow
cd artifacts/api-server
node build.mjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro ao compilar!" -ForegroundColor Red
    exit 1
}

cd ../..

# 2. Verificar se dist foi criado
if (-not (Test-Path "artifacts/api-server/dist/bot/index.mjs")) {
    Write-Host ""
    Write-Host "❌ Build não foi criado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

# 3. Ver tamanho do dist
$distSize = (Get-ChildItem -Path "artifacts/api-server/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "📊 Tamanho do build: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""

# 4. Commit
Write-Host "📝 Commitando arquivos..." -ForegroundColor Yellow
git add .gitignore start-bot.mjs artifacts/api-server/dist/
git status --short

Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Yellow
git commit -m "Deploy: build pre-compilado para Discloud"

Write-Host ""
Write-Host "Fazendo push..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ BUILD E COMMIT CONCLUÍDOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Baixe o ZIP do GitHub" -ForegroundColor White
Write-Host "   https://github.com/SEU_USUARIO/Anime-RPG-Discord" -ForegroundColor Gray
Write-Host "   Code → Download ZIP" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Delete o bot atual no Discloud" -ForegroundColor White
Write-Host ""
Write-Host "3. Upload do novo ZIP" -ForegroundColor White
Write-Host ""
Write-Host "4. Configure as env vars" -ForegroundColor White
Write-Host "   DISCORD_TOKEN=..." -ForegroundColor Gray
Write-Host "   DISCORD_CLIENT_ID=..." -ForegroundColor Gray
Write-Host "   DATABASE_URL=postgresql://..." -ForegroundColor Gray
Write-Host ""
Write-Host "5. Start e aguarde 2-3 minutos" -ForegroundColor White
Write-Host "   (agora é rápido, sem build!)" -ForegroundColor Gray
Write-Host ""
Write-Host "O bot vai iniciar IMEDIATAMENTE! 🚀" -ForegroundColor Green
