# Commit das mudanças de banner
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA DE BANNERS - COMMIT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Adicionando arquivos..." -ForegroundColor Yellow
git add lib/db/src/schema/index.ts
git add lib/db/src/data/characters.ts
git add lib/db/drizzle/0011_add_character_banner.sql
git add lib/db/scripts/add-character-banners.mjs
git add artifacts/api-server/src/bot/embeds.ts
git add artifacts/api-server/src/bot/handlers.ts
git add CHARACTER_BANNERS.md

Write-Host ""
git status --short

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

Write-Host ""
Write-Host "📝 Adicionando dist..." -ForegroundColor Yellow
git add artifacts/api-server/dist/

Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Yellow
git commit -m "feat: adicionar campo banner em personagens

- Novo campo bannerUrl em characters (nullable)
- Migration 0011_add_character_banner.sql
- Embeds usam banner como imagem + avatar como thumbnail
- Atualizado: /invocar, /personagem, /perfil
- Script add-character-banners.mjs para popular dados
- Retrocompatível: funciona sem banner"

Write-Host ""
Write-Host "Fazendo push..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ SISTEMA DE BANNERS COMMITADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Mudanças aplicadas:" -ForegroundColor Cyan
Write-Host "  ✅ Campo bannerUrl adicionado ao schema" -ForegroundColor Gray
Write-Host "  ✅ Migration 0011 criada" -ForegroundColor Gray
Write-Host "  ✅ /invocar usa banner + thumbnail" -ForegroundColor Gray
Write-Host "  ✅ /personagem usa banner + thumbnail" -ForegroundColor Gray
Write-Host "  ✅ /perfil usa banner + thumbnail" -ForegroundColor Gray
Write-Host "  ✅ Script para adicionar banners criado" -ForegroundColor Gray
Write-Host "  ✅ Documentação completa em CHARACTER_BANNERS.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Aplicar migration: node lib/db/scripts/apply-all-migrations.mjs" -ForegroundColor White
Write-Host "  2. Adicionar banners: node lib/db/scripts/add-character-banners.mjs" -ForegroundColor White
Write-Host "  3. Testar no Discord: /invocar single" -ForegroundColor White
Write-Host ""
Write-Host "🎨 Banners deixam invocações MUITO mais épicas! 🚀" -ForegroundColor Green
