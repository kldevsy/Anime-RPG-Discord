/**
 * Verifica se o catálogo mudou desde a última verificação
 */
export declare function hasCatalogChanged(): boolean;
/**
 * Mantém o catálogo de banco de dados sincronizado com o catálogo TypeScript editável.
 *
 * Agora detecta automaticamente mudanças no catálogo através de hash,
 * eliminando necessidade de sincronização manual.
 *
 * Personagens com nomes únicos e `catalogManaged = false` (criados via admin)
 * são preservados. Entradas existentes do catálogo são sincronizadas.
 */
export declare function syncCharacterCatalog(options?: {
    force?: boolean;
}): Promise<{
    insertedOrUpdated: number;
    skipped: boolean;
    reason: string;
    hash?: undefined;
} | {
    insertedOrUpdated: number;
    skipped: boolean;
    hash: string;
    reason: string;
}>;
//# sourceMappingURL=catalog-sync.d.ts.map