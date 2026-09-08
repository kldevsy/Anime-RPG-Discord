# Script para substituir interaction.followUp por respond no handleButtonInteraction
$file = "artifacts/api-server/src/bot/handlers.ts"
$content = Get-Content $file -Raw

# Substituir apenas dentro da função handleButtonInteraction (antes de handleSelectMenuInteraction)
$pattern = '(?s)(export async function handleButtonInteraction.*?)(export async function handleSelectMenuInteraction)'
$match = [regex]::Match($content, $pattern)

if ($match.Success) {
    $buttonHandler = $match.Groups[1].Value
    $restOfFile = $match.Groups[2].Value + $content.Substring($match.Index + $match.Length)
    
    # Substituir interaction.followUp por respond
    $fixedButtonHandler = $buttonHandler -replace 'interaction\.followUp\(', 'respond('
    
    # Reconstruir arquivo
    $newContent = $content.Substring(0, $match.Index) + $fixedButtonHandler + $restOfFile
    
    Set-Content $file $newContent -NoNewline
    Write-Host "✅ Substituições feitas com sucesso!"
} else {
    Write-Host "❌ Padrão não encontrado"
}
