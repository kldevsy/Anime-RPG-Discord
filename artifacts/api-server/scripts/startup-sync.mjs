import { spawn } from "node:child_process";

const databaseEnabled =
  process.env.USE_DATABASE === "true" && Boolean(process.env.DATABASE_URL);

process.stdout.write(
  `[startup-sync] Discord configuration: token=${process.env.DISCORD_TOKEN ? "present" : "missing"}, clientId=${process.env.CLIENT_ID ? "present" : "missing"}.\n`,
);

if (!databaseEnabled) {
  process.stdout.write(
    "[startup-sync] Database sync skipped: USE_DATABASE=true and DATABASE_URL are required.\n",
  );
  process.exit(0);
}

process.stdout.write("[startup-sync] Applying database migrations...\n");

const migrate = spawn(
  "pnpm",
  ["--filter", "@workspace/db", "run", "migrate"],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  },
);

migrate.on("error", (error) => {
  process.stderr.write(`[startup-sync] Migration process failed: ${error.message}\n`);
  process.exit(1);
});

migrate.on("close", (code, signal) => {
  if (code !== 0) {
    process.stderr.write(
      `[startup-sync] Migrations failed${signal ? ` (${signal})` : ""} with exit code ${code ?? "unknown"}.\n`,
    );
    process.exit(code ?? 1);
  }

  process.stdout.write("[startup-sync] Database migrations are up to date.\n");
  process.stdout.write("[startup-sync] Synchronizing the character catalog...\n");

  const seed = spawn(
    "pnpm",
    ["--filter", "@workspace/db", "run", "seed"],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    },
  );

  seed.on("error", (error) => {
    process.stderr.write(`[startup-sync] Catalog sync process failed: ${error.message}\n`);
    process.exit(1);
  });

  seed.on("close", (seedCode, seedSignal) => {
    if (seedCode !== 0) {
      process.stderr.write(
        `[startup-sync] Catalog sync failed${seedSignal ? ` (${seedSignal})` : ""} with exit code ${seedCode ?? "unknown"}.\n`,
      );
      process.exit(seedCode ?? 1);
    }

    process.stdout.write("[startup-sync] Database and catalog synchronization complete.\n");
  });
});