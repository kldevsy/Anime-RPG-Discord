# Commit final para Discloud
Write-Host "=== Preparando deploy final para Discloud ===" -ForegroundColor Cyan
Write-Host ""

git add package.json discloud.config start-bot.mjs
git status

Write-Host ""
Write-Host "Commitando..." -ForegroundColor Yellow
git commit -m "Fix: criar script wrapper start-bot.mjs para Discloud"

Write-Host ""
Write-Host "Fazendo push..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOY PRONTO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Mudanças aplicadas:" -ForegroundColor Cyan
Write-Host "  ✓ Removido script 'prepare' que causava erro" -ForegroundColor Gray
Write-Host "  ✓ Criado start-bot.mjs (wrapper que compila + inicia)" -ForegroundColor Gray
Write-Host "  ✓ discloud.config agora aponta para start-bot.mjs" -ForegroundColor Gray
Write-Host "  ✓ RAM aumentada para 512 MB" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Baixe novo ZIP do GitHub" -ForegroundColor White
Write-Host "     https://github.com/SEU_USUARIO/Anime-RPG-Discord" -ForegroundColor Gray
Write-Host "     Code → Download ZIP" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Delete o bot atual no Discloud" -ForegroundColor White
Write-Host ""
Write-Host "  3. Faça novo upload do ZIP" -ForegroundColor White
Write-Host ""
Write-Host "  4. Configure as env vars:" -ForegroundColor White
Write-Host "     DISCORD_TOKEN=..." -ForegroundColor Gray
Write-Host "     DISCORD_CLIENT_ID=..." -ForegroundColor Gray
Write-Host "     DATABASE_URL=postgresql://..." -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Start e aguarde 10-15 min" -ForegroundColor White
Write-Host ""
Write-Host "Agora vai funcionar! 🚀" -ForegroundColor Green
