---
name: Discord battle presentation
description: Battle presentation uses server snapshots and edited embeds for automatic turn-by-turn playback.
---

The Discord battle UI should remain a projection of the server-authoritative engine: emit snapshots after meaningful actions, edit one deferred reply at a paced interval, and use the final snapshot for rewards and the persisted result.

**Why:** This gives the player an animated battle without moving combat decisions into Discord handlers or creating a second battle implementation.

**How to apply:** Keep the engine responsible for turn progression and the bot responsible only for pacing and rendering HP, energy, effects, initiative, actions, and rewards.