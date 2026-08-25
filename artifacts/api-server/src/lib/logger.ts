import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "DATABASE_URL",
      "DISCORD_TOKEN",
      "CLIENT_ID",
      "password",
      "token",
      "secret",
      "credentials",
      "apiKey",
      "*.password",
      "*.token",
      "*.secret",
      "*.credentials",
      "*.apiKey",
    ],
    remove: true,
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
