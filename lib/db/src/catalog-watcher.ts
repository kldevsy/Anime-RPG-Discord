import { syncCharacterCatalog, hasCatalogChanged } from "./catalog-sync.ts";
import { logger } from "./logger.ts";

let watcherInterval: NodeJS.Timeout | null = null;
let isWatching = false;

/**
 * Inicia monitoramento automático do catálogo de personagens.
 * 
 * Verifica periodicamente se o catálogo mudou e sincroniza automaticamente.
 * Útil em modo desenvolvimento quando você edita characters.ts.
 */
export function startCatalogWatcher(intervalMs = 5000) {
  if (isWatching) {
    logger?.warn("Catalog watcher já está ativo");
    return;
  }

  isWatching = true;
  logger?.info({ intervalMs }, "Iniciando monitoramento automático do catálogo");

  watcherInterval = setInterval(async () => {
    try {
      if (hasCatalogChanged()) {
        logger?.info("Mudança detectada no catálogo, sincronizando...");
        const result = await syncCharacterCatalog();
        
        if (!result.skipped) {
          logger?.info(
            { count: result.insertedOrUpdated, hash: result.hash },
            "Catálogo sincronizado automaticamente"
          );
        }
      }
    } catch (error) {
      logger?.error({ error }, "Erro ao sincronizar catálogo automaticamente");
    }
  }, intervalMs);
}

/**
 * Para o monitoramento automático do catálogo
 */
export function stopCatalogWatcher() {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
    isWatching = false;
    logger?.info("Monitoramento do catálogo parado");
  }
}

/**
 * Verifica se o watcher está ativo
 */
export function isWatcherActive(): boolean {
  return isWatching;
}
