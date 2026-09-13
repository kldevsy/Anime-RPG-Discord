import * as schema from "./schema/index.ts";
export declare const databaseConfigured: boolean;
export declare const pool: import("pg").Pool | null;
export declare const db: (import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
}) | null;
export * from "./schema/index.ts";
export * from "./data/characters.ts";
export * from "./catalog-sync.ts";
export * from "./catalog-watcher.ts";
//# sourceMappingURL=index.d.ts.map