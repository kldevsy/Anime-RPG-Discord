# Fix: instalar dependências do api-server (esbuild)
Write-Host "Commitando fix para esbuild..." -ForegroundColor Cyan

git add start-bot.mjs
git commit -m "Fix: instalar deps do api-server antes de buildar"
git push origin main

Write-Host ""
Write-Host "✅ PRONTO!" -ForegroundColor Green
Write-Host ""
Write-Host "O script agora vai:" -ForegroundColor Yellow
Write-Host "  1. Instalar dependências da raiz (npm install)" -ForegroundColor Gray
Write-Host "  2. Instalar dependências do api-server (esbuild, etc)" -ForegroundColor Gray
Write-Host "  3. Compilar o código TypeScript" -ForegroundColor Gray
Write-Host "  4. Aplicar migrations" -ForegroundColor Gray
Write-Host "  5. Iniciar o bot" -ForegroundColor Gray
Write-Host ""
Write-Host "Baixe novo ZIP e re-upload no Discloud!" -ForegroundColor Cyan
