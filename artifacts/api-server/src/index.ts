import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot";
import { syncCharacterCatalog } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  const catalogSync = await syncCharacterCatalog();
  if (!catalogSync.skipped) {
    logger.info({ count: catalogSync.insertedOrUpdated }, "Character catalog synchronized");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    if (process.env["DISCORD_TOKEN"]) {
      startBot().catch((botErr) => {
        logger.error({ err: botErr }, "Error starting Discord bot");
      });
    }
  });
}

startServer().catch((err) => {
  logger.error({ err }, "Error initializing server");
  process.exit(1);
});
