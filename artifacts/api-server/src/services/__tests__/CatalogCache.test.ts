import { describe, it, expect, beforeEach } from "vitest";
import { CatalogCache } from "../CatalogCache";

describe("CatalogCache", () => {
  beforeEach(() => {
    CatalogCache.invalidate();
  });

  it("caches and retrieves character list", async () => {
    const list1 = await CatalogCache.getAllCharacters();
    expect(list1.length).toBeGreaterThan(0);

    const list2 = await CatalogCache.getAllCharacters();
    expect(list2).toBe(list1); // same cached memory reference
  });

  it("finds single character by ID", async () => {
    const all = await CatalogCache.getAllCharacters();
    const target = all[0];
    const retrieved = await CatalogCache.getCharacter(target.id);
    expect(retrieved?.name).toBe(target.name);
  });
});
