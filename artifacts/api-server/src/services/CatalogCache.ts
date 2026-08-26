import { eq } from "drizzle-orm";
import { characters, db, type Character, hasCatalogChanged } from "@workspace/db";
import { listCharacters } from "./PhaseOneService";

export class CatalogCache {
  private static cache = new Map<string, Character>();
  private static allCache: Character[] | null = null;
  private static lastFetched = 0;
  private static lastCatalogCheck = 0;
  private static TTL = 300000; // 5 minutes cache TTL
  private static catalogCheckInterval = 1000; // Verifica mudanças a cada 1 segundo (reduzido de 5s)

  /**
   * Verifica se o catálogo mudou e invalida cache se necessário
   */
  private static async checkCatalogChanges(): Promise<void> {
    const now = Date.now();
    // Evita verificações muito frequentes
    if (now - this.lastCatalogCheck < this.catalogCheckInterval) {
      return;
    }

    this.lastCatalogCheck = now;

    if (hasCatalogChanged()) {
      console.log("🔄 [CatalogCache] Mudança no catálogo detectada! Invalidando cache...");
      this.invalidate();
      console.log("✅ [CatalogCache] Cache invalidado com sucesso");
    }
  }

  /**
   * Retrieves a character from cache by ID or fetches from database/memory.
   * Automatically detects catalog changes and invalidates cache when needed.
   */
  static async getCharacter(characterId: string): Promise<Character | null> {
    await this.checkCatalogChanges();

    if (this.cache.has(characterId)) {
      return this.cache.get(characterId)!;
    }

    const all = await this.getAllCharacters();
    const found = all.find((c: Character) => c.id === characterId) ?? null;
    if (found) {
      this.cache.set(characterId, found);
    }
    return found;
  }

  /**
   * Retrieves all characters with memory caching to prevent redundant database queries.
   * Automatically detects catalog changes and refreshes cache when needed.
   */
  static async getAllCharacters(): Promise<Character[]> {
    await this.checkCatalogChanges();

    const now = Date.now();
    if (this.allCache && now - this.lastFetched < this.TTL) {
      return this.allCache;
    }

    const all = await listCharacters({});
    this.allCache = all;
    all.forEach((c: Character) => this.cache.set(c.id, c));
    this.lastFetched = now;
    return all;
  }

  /**
   * Invalida todo o cache manualmente
   */
  static invalidate(): void {
    this.cache.clear();
    this.allCache = null;
    this.lastFetched = 0;
  }
}
