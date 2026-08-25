---
name: PvE schema drift
description: The development database can have PvE tables without matching migration history or newer columns.
---

When a Drizzle query fails because a PvE column is missing, compare the live table with the schema before changing service code. Repair missing columns with an idempotent migration and synchronize migration metadata when the existing database was created outside Drizzle.

**Why:** The database may contain an older PvE table while the repository snapshot already includes newer fields; changing the query would discard battle mechanics and hide the real schema problem.

**How to apply:** Check `information_schema` and the Drizzle migration table, use `ADD COLUMN IF NOT EXISTS` for safe repairs, then run the normal migration command and recheck the API route.