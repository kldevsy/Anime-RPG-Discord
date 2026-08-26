1

/**
 * Script de teste para o sistema de auto-sincronização do catálogo
 * 
 * Uso:
 * node test-auto-sync.mjs [comando]
 * 
 * Comandos:
 * - status: Verifica se há mudanças pendentes
 * - sync: Força sincronização manual
 * - help: Mostra esta mensagem
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function checkStatus() {
  console.log("🔍 Verificando status do catálogo...\n");
  
  try {
    const response = await fetch(`${BASE_URL}/admin/catalog-status`);
    const data = await response.json();
    
    if (data.success) {
      console.log("✅ Status:", data.data.message);
      console.log("   Mudanças pendentes:", data.data.hasPendingChanges ? "Sim" : "Não");
    } else {
      console.error("❌ Erro:", data.error);
    }
  } catch (error) {
    console.error("❌ Erro ao conectar:", error.message);
    console.log("\n💡 Certifique-se que o servidor está rodando em", BASE_URL);
  }
}

async function forceSync() {
  console.log("⚡ Forçando sincronização do catálogo...\n");
  
  try {
    const response = await fetch(`${BASE_URL}/admin/sync-catalog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    
    if (data.success) {
      console.log("✅", data.message);
      console.log("\n📊 Detalhes:");
      console.log("   Personagens atualizados:", data.data.charactersUpdated);
      console.log("   Motivo:", data.data.reason);
      console.log("   Hash:", data.data.hash?.substring(0, 16) + "...");
    } else {
      console.error("❌ Erro:", data.error);
      if (data.details) {
        console.error("   Detalhes:", data.details);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao conectar:", error.message);
    console.log("\n💡 Certifique-se que o servidor está rodando em", BASE_URL);
  }
}

function showHelp() {
  console.log(`
🔄 Sistema de Auto-Sincronização do Catálogo

Uso: node test-auto-sync.mjs [comando]

Comandos disponíveis:

  status    Verifica se há mudanças pendentes no catálogo
  sync      Força sincronização manual imediata
  help      Mostra esta mensagem

Exemplos:

  node test-auto-sync.mjs status
  node test-auto-sync.mjs sync

Configuração:

  API_URL   URL base da API (padrão: http://localhost:3000)
  
  Exemplo: API_URL=http://localhost:4000 node test-auto-sync.mjs status

Mais informações: veja CATALOG_AUTO_SYNC.md
  `);
}

// Main
const command = process.argv[2] || "help";

console.log("🎮 Anime RPG - Sistema de Auto-Sincronização\n");

switch (command) {
  case "status":
    await checkStatus();
    break;
  case "sync":
    await forceSync();
    break;
  case "help":
  default:
    showHelp();
    break;
}
