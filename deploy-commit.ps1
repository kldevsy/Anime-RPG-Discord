# Script para commitar arquivos de deploy
Write-Host "Preparando deploy..." -ForegroundColor Cyan

git add discloud.config
git add DEPLOY_DISCLOUD_FINAL.md
git add package.json
git add .discloudignore

Write-Host "Commitando..." -ForegroundColor Yellow
git commit -m "Fix: Discloud auto-build configurado"

Write-Host "Fazendo push..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ PRONTO!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora:" -ForegroundColor Cyan
Write-Host "1. Vá para seu repositório no GitHub"
Write-Host "2. Clique em: Code → Download ZIP"
Write-Host "3. Faça upload no Discloud"
Write-Host ""
Write-Host "O Discloud vai compilar automaticamente! 🚀" -ForegroundColor Green
