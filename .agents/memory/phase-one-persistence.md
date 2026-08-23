---
name: Phase 1 persistence
description: Durable architecture decisions for the first Anime RPG Discord backend phase.
---

The first phase treats PostgreSQL as the only source of truth for profiles, character ownership, and team membership. When it is not configured, API data endpoints must fail explicitly rather than returning mock or in-memory state.

**Why:** Character ownership and ordered teams are security-sensitive state; a fallback store could make local behavior appear successful while losing progress or bypassing consistency guarantees.

**How to apply:** Keep writes transactional, validate every Discord-supplied value at the server boundary, and preserve the five-character team limit and ownership checks in the service layer.