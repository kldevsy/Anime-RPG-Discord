/**
 * Inicia monitoramento automático do catálogo de personagens.
 *
 * Verifica periodicamente se o catálogo mudou e sincroniza automaticamente.
 * Útil em modo desenvolvimento quando você edita characters.ts.
 */
export declare function startCatalogWatcher(intervalMs?: number): void;
/**
 * Para o monitoramento automático do catálogo
 */
export declare function stopCatalogWatcher(): void;
/**
 * Verifica se o watcher está ativo
 */
export declare function isWatcherActive(): boolean;
//# sourceMappingURL=catalog-watcher.d.ts.map