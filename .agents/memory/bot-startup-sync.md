---
name: Bot startup synchronization
description: The startup contract for keeping the Discord bot aligned with the current project and database.
---

The bot startup path must apply database migrations, synchronize catalog data, rebuild the current source, and then start the Discord client. Missing Discord configuration must be reported explicitly rather than silently skipping the bot.

**Why:** The bot runs compiled output and can otherwise appear healthy while serving stale code or not connecting at all.

**How to apply:** Preserve the same startup sequence for the Run workflow and any standalone bot command. Keep database synchronization conditional on the configured database mode, but never hide a missing Discord token.

In this workspace's Drizzle Kit version, the CLI spinner can hide the underlying PostgreSQL exception and only return exit code 1. The startup path uses Drizzle ORM's migrator directly so migration failures retain their database message and stack.

**Why:** A generic migration exit code is not actionable and can make a healthy Discord configuration look like a bot problem.

**How to apply:** Keep the direct migrator wrapper as the runtime migration command; retain the Drizzle Kit command only as an optional manual fallback.