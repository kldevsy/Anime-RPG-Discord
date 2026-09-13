# Deploy Final - Com todas as dependências
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY FINAL PARA DISCLOUD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Commitando arquivos..." -ForegroundColor Yellow
git add package.json discloud.config
git status --short

Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Yellow
git commit -m "Fix: adicionar deps runtime + RAM 1GB"

Write-Host ""
Write-Host "Fazendo push..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ TUDO PRONTO PARA DEPLOY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Mudanças aplicadas:" -ForegroundColor Cyan
Write-Host "  ✓ package.json com deps runtime (discord.js, pg, etc)" -ForegroundColor Gray
Write-Host "  ✓ RAM aumentada para 1024 MB (1 GB)" -ForegroundColor Gray
Write-Host "  ✓ Build pré-compilado commitado" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  • RAM 1GB requer Discloud Pro (~R$ 5/mês)" -ForegroundColor Gray
Write-Host "  • Discloud Free só tem 100 MB RAM" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Baixe o ZIP do GitHub" -ForegroundColor White
Write-Host "   https://github.com/SEU_USUARIO/Anime-RPG-Discord" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Upload no Discloud (Pro)" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure as env vars:" -ForegroundColor White
Write-Host "   DISCORD_TOKEN=..." -ForegroundColor Gray
Write-Host "   DISCORD_CLIENT_ID=..." -ForegroundColor Gray
Write-Host "   DATABASE_URL=postgresql://..." -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start e aguarde 2-3 minutos" -ForegroundColor White
Write-Host ""
Write-Host "Agora vai funcionar! 🚀" -ForegroundColor Green
