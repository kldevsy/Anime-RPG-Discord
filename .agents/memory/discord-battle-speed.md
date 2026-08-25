---
name: Discord battle speed
description: Battle animation speed is selected per command and defaults to slow.
---

Battle playback should expose a per-command speed choice with slow as the default, while keeping combat calculation independent from presentation pacing.

**Why:** Players need readable turn-by-turn feedback, but faster playback remains useful for repeat farming.

**How to apply:** Keep speed values in the Discord handler's presentation layer; never alter engine turn order, damage, rewards, or persistence based on the selected speed.