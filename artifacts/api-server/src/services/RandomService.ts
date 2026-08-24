import { randomInt } from "node:crypto";

export function randomPercent(): number {
  return randomInt(0, 1000000) / 10000;
}

export function pickWeighted<T>(items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) throw new Error("Weighted table must have a positive total.");
  let cursor = randomPercent() / 100 * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item.item;
  }
  return items[items.length - 1].item;
}