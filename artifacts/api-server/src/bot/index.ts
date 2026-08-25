import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { commandDefinitions } from "./commands";
import { handleAutocompleteInteraction, handleInteraction } from "./handlers";
import { logger } from "../lib/logger";

export class BotInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotInitializationError";
  }
}

export function validateBotEnv() {
  const token = process.env["DISCORD_TOKEN"];
  const clientId = process.env["CLIENT_ID"];

  if (!token) {
    logger.warn("DISCORD_TOKEN environment variable is not set. Discord bot client will not connect.");
    return null;
  }
  if (!clientId) {
    logger.warn("CLIENT_ID environment variable is not set. Discord slash commands will not be registered.");
  }

  return { token, clientId, guildId: process.env["GUILD_ID"] };
}

export async function registerCommands(token: string, clientId: string, guildId?: string) {
  const rest = new REST({ version: "10" }).setToken(token);
  const commandsJson = commandDefinitions.map((cmd) => cmd.toJSON());

  try {
    if (guildId) {
      logger.info({ guildId, count: commandsJson.length }, "Registering guild slash commands...");
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsJson });
      logger.info("Guild slash commands registered successfully.");
    } else {
      logger.info({ count: commandsJson.length }, "Registering global slash commands...");
      await rest.put(Routes.applicationCommands(clientId), { body: commandsJson });
      logger.info("Global slash commands registered successfully.");
    }
  } catch (err) {
    logger.error({ err }, "Error registering slash commands with Discord REST API");
  }
}

export function createBotClient() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  client.once("ready", () => {
    logger.info({ user: client.user?.tag }, "Discord Bot client logged in and ready!");
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
      logger.info({ command: interaction.commandName, user: interaction.user.tag }, "Received autocomplete interaction");
      try {
        await handleAutocompleteInteraction(interaction);
      } catch (err) {
        logger.error({ err, command: interaction.commandName }, "Autocomplete interaction failed");
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;
    logger.info({ command: interaction.commandName, user: interaction.user.tag }, "Received chat input command interaction");
    try {
      await handleInteraction(interaction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Chat input command interaction failed");
    }
  });

  return client;
}

let botClient: Client | null = null;

export async function startBot() {
  const env = validateBotEnv();
  if (!env) return null;

  if (env.clientId) {
    await registerCommands(env.token, env.clientId, env.guildId);
  }

  botClient = createBotClient();
  await botClient.login(env.token);
  return botClient;
}

export function getBotClient() {
  return botClient;
}

// If invoked directly as a standalone process (e.g., via `pnpm run bot`)
if (process.argv[1]?.includes("bot/index") || process.argv[1]?.includes("bot/index.mjs")) {
  startBot().catch((err) => {
    logger.error({ err }, "Failed to start Discord bot standalone process");
    process.exit(1);
  });
}
