import { eq } from "drizzle-orm";
import { characters, db, type Character } from "@workspace/db";
import { listCharacters } from "./PhaseOneService";

export class CatalogCache {
  private static cache = new Map<string, Character>();
  private static allCache: Character[] | null = null;
  private static lastFetched = 0;
  private static TTL = 300000; // 5 minutes cache TTL

  /**
   * Retrieves a character from cache by ID or fetches from database/memory.
   */
  static async getCharacter(characterId: string): Promise<Character | null> {
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
   */
  static async getAllCharacters(): Promise<Character[]> {
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

  static invalidate(): void {
    this.cache.clear();
    this.allCache = null;
    this.lastFetched = 0;
  }
}
