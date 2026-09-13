# Fix para Discloud - Remover restricao pnpm
Write-Host "Commitando fix..." -ForegroundColor Cyan

git add package.json
git commit -m "Fix: permitir npm para Discloud"
git push origin main

Write-Host ""
Write-Host "✅ PRONTO!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora:" -ForegroundColor Yellow
Write-Host "1. Baixe o ZIP do GitHub novamente"
Write-Host "2. Re-upload no Discloud"
Write-Host "3. Agora vai funcionar! npm install vai passar" -ForegroundColor Green
