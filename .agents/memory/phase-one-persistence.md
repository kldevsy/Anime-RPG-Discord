---
name: Phase 1 persistence
description: Durable architecture decisions for the first Anime RPG Discord backend phase.
---

The first phase supports two explicit modes: local in-memory persistence by default for development, and PostgreSQL when `USE_DATABASE=true` with a valid `DATABASE_URL`. The local mode is intentionally temporary and loses state on restart.

**Why:** The user needs to run and exercise the bot before authorizing Neon, while production-like persistence must still remain server-authoritative and opt-in.

**How to apply:** Keep the PostgreSQL path transactional, validate every Discord-supplied value at the server boundary, and preserve the five-character team limit and ownership checks in both modes.