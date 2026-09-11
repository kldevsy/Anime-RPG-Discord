# Script PowerShell para preparar deploy na Discloud

Write-Host "🚀 Preparando deploy para Discloud..." -ForegroundColor Cyan
Write-Host ""

# 1. Instalar dependências
Write-Host "📦 [1/4] Instalando dependências..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

# 2. Aplicar migrations
Write-Host "📊 [2/4] Aplicando migrations do banco de dados..." -ForegroundColor Yellow
node lib/db/scripts/apply-all-migrations.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Erro nas migrations (pode ser normal se já aplicadas)" -ForegroundColor Yellow
}

# 3. Build do projeto
Write-Host "🔨 [3/4] Compilando TypeScript..." -ForegroundColor Yellow
Set-Location artifacts/api-server
node build.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar!" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Set-Location ../..

# 4. Verificar arquivos necessários
Write-Host "✅ [4/4] Verificando arquivos..." -ForegroundColor Yellow

if (Test-Path "discloud.config") {
    Write-Host "✅ discloud.config encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ discloud.config não encontrado!" -ForegroundColor Red
    exit 1
}

if (Test-Path "artifacts/api-server/dist/bot/index.mjs") {
    Write-Host "✅ Bot compilado com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao compilar bot!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Projeto pronto para deploy na Discloud!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure as variáveis de ambiente (.env):" -ForegroundColor White
Write-Host "   - DISCORD_TOKEN" -ForegroundColor Gray
Write-Host "   - DISCORD_CLIENT_ID" -ForegroundColor Gray
Write-Host "   - DATABASE_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Faça upload do projeto para Discloud:" -ForegroundColor White
Write-Host "   - Acesse: https://discloud.app" -ForegroundColor Gray
Write-Host "   - Faça upload do ZIP do projeto" -ForegroundColor Gray
Write-Host "   - Configure as variáveis de ambiente" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Seu bot estará online em alguns minutos! 🎮" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Use 7-Zip ou WinRAR para criar o ZIP" -ForegroundColor Yellow
