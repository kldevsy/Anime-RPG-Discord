---
name: Discord autocomplete retries
description: Discord autocomplete interactions can be acknowledged more than once and must not crash the bot.
---

Autocomplete handlers should treat Discord error 40060 as an idempotent duplicate response, check whether the interaction already responded, and catch listener-level errors so one malformed interaction cannot terminate the bot.

**Why:** Discord may deliver or trigger the same autocomplete interaction concurrently; a second `respond` call produces “Interaction has already been acknowledged.”

**How to apply:** Route every autocomplete response through one guarded helper and keep the `interactionCreate` listener protected with error logging.