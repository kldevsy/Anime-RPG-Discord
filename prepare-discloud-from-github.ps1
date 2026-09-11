# Script para preparar ZIP do GitHub para Discloud
# Uso: .\prepare-discloud-from-github.ps1

Write-Host "=== Preparando ZIP do GitHub para Discloud ===" -ForegroundColor Cyan

# 1. Verificar se o ZIP do GitHub existe
$githubZip = "Anime-RPG-Discord-main.zip"
if (-not (Test-Path $githubZip)) {
    Write-Host "ERRO: Não encontrei o arquivo '$githubZip'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Vá para: https://github.com/SEU_USUARIO/Anime-RPG-Discord" -ForegroundColor Yellow
    Write-Host "2. Clique em: Code → Download ZIP" -ForegroundColor Yellow
    Write-Host "3. Salve o ZIP nesta pasta: $PWD" -ForegroundColor Yellow
    Write-Host "4. Execute este script novamente" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ ZIP do GitHub encontrado: $githubZip" -ForegroundColor Green

# 2. Criar pasta temporária
$tempDir = "temp-discloud-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "→ Criando pasta temporária: $tempDir" -ForegroundColor Gray
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# 3. Extrair ZIP
Write-Host "→ Extraindo ZIP..." -ForegroundColor Gray
Expand-Archive -Path $githubZip -DestinationPath $tempDir -Force

# 4. Mover conteúdo para raiz (remover pasta Anime-RPG-Discord-main)
$extractedFolder = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1
if ($extractedFolder) {
    Write-Host "→ Movendo arquivos da pasta interna..." -ForegroundColor Gray
    $contentPath = Join-Path $tempDir $extractedFolder.Name
    $files = Get-ChildItem -Path $contentPath -Force
    foreach ($file in $files) {
        $dest = Join-Path $tempDir $file.Name
        Move-Item -Path $file.FullName -Destination $dest -Force
    }
    Remove-Item -Path $contentPath -Force
}

# 5. Verificar estrutura
Write-Host ""
Write-Host "→ Verificando estrutura..." -ForegroundColor Gray
$mainFile = Join-Path $tempDir "artifacts\api-server\dist\bot\index.mjs"
$packageJson = Join-Path $tempDir "package.json"
$discloudConfig = Join-Path $tempDir "discloud.config"

if (-not (Test-Path $mainFile)) {
    Write-Host "ERRO: Arquivo principal não encontrado: $mainFile" -ForegroundColor Red
    Write-Host "Verifique se você fez o commit do build para o GitHub!" -ForegroundColor Yellow
    Remove-Item -Path $tempDir -Recurse -Force
    exit 1
}

if (-not (Test-Path $packageJson)) {
    Write-Host "ERRO: package.json não encontrado!" -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force
    exit 1
}

if (-not (Test-Path $discloudConfig)) {
    Write-Host "ERRO: discloud.config não encontrado!" -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force
    exit 1
}

Write-Host "  ✓ artifacts/api-server/dist/bot/index.mjs" -ForegroundColor Green
Write-Host "  ✓ package.json" -ForegroundColor Green
Write-Host "  ✓ discloud.config" -ForegroundColor Green

# 6. Criar ZIP final
$finalZip = "discloud-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Write-Host ""
Write-Host "→ Criando ZIP para Discloud: $finalZip" -ForegroundColor Gray

# PowerShell 5+ tem Compress-Archive, mas é lento para muitos arquivos
# Vamos usar a forma mais rápida
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $finalZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 7. Limpar pasta temporária
Write-Host "→ Limpando arquivos temporários..." -ForegroundColor Gray
Remove-Item -Path $tempDir -Recurse -Force

# 8. Verificar tamanho
$zipSize = (Get-Item $finalZip).Length / 1MB
Write-Host ""
Write-Host "=== SUCESSO! ===" -ForegroundColor Green
Write-Host "ZIP criado: $finalZip" -ForegroundColor Cyan
Write-Host "Tamanho: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan

if ($zipSize -gt 100) {
    Write-Host ""
    Write-Host "AVISO: ZIP maior que 100 MB!" -ForegroundColor Red
    Write-Host "Discloud Free só aceita até 100 MB." -ForegroundColor Yellow
    Write-Host "Considere fazer upgrade para Discloud Pro." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://discloud.app/dashboard" -ForegroundColor White
    Write-Host "2. Clique em: Upload Bot" -ForegroundColor White
    Write-Host "3. Selecione o arquivo: $finalZip" -ForegroundColor White
    Write-Host "4. Configure as variáveis de ambiente:" -ForegroundColor White
    Write-Host "   DISCORD_TOKEN=seu_token" -ForegroundColor Gray
    Write-Host "   DISCORD_CLIENT_ID=seu_client_id" -ForegroundColor Gray
    Write-Host "   DATABASE_URL=postgresql://..." -ForegroundColor Gray
    Write-Host "5. Inicie o bot e aguarde 5-10 minutos" -ForegroundColor White
    Write-Host "   (Discloud vai instalar dependências)" -ForegroundColor Gray
}

Write-Host ""
