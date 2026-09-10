import { spawn } from "node:child_process";

const databaseEnabled =
  process.env.USE_DATABASE === "true" && Boolean(process.env.DATABASE_URL);

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        CI: "1",
        FORCE_COLOR: "0",
        NO_COLOR: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

function printCommandOutput(label, output) {
  const cleaned = output
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r/g, "");
  if (cleaned.trim()) {
    process.stderr.write(`[startup-sync] ${label} output:\n${cleaned}\n`);
  }
}

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

let migrate;
try {
  migrate = await runCommand(
    "pnpm",
    ["--filter", "@workspace/db", "run", "migrate"],
  );
} catch (error) {
  process.stderr.write(`[startup-sync] Migration process failed: ${error.message}\n`);
  process.exit(1);
}

if (migrate.code !== 0) {
  printCommandOutput("Migration", `${migrate.stdout}${migrate.stderr}`);
  process.stderr.write(
    `[startup-sync] Migrations failed${migrate.signal ? ` (${migrate.signal})` : ""} with exit code ${migrate.code ?? "unknown"}.\n`,
  );
  process.exit(migrate.code ?? 1);
}

process.stdout.write("[startup-sync] Database migrations are up to date.\n");
process.stdout.write("[startup-sync] Synchronizing the character catalog...\n");

let seed;
try {
  seed = await runCommand(
    "pnpm",
    ["--filter", "@workspace/db", "run", "seed"],
  );
} catch (error) {
  process.stderr.write(`[startup-sync] Catalog sync process failed: ${error.message}\n`);
  process.exit(1);
}

if (seed.code !== 0) {
  printCommandOutput("Catalog sync", `${seed.stdout}${seed.stderr}`);
  process.stderr.write(
    `[startup-sync] Catalog sync failed${seed.signal ? ` (${seed.signal})` : ""} with exit code ${seed.code ?? "unknown"}.\n`,
  );
  process.exit(seed.code ?? 1);
}

process.stdout.write("[startup-sync] Database and catalog synchronization complete.\n");

// Sincronizar catálogo de equipamentos
process.stdout.write("[startup-sync] Synchronizing the equipment catalog...\n");

let seedEquipment;
try {
  seedEquipment = await runCommand(
    "pnpm",
    ["--filter", "@workspace/db", "run", "seed:equipment"],
  );
} catch (error) {
  process.stderr.write(`[startup-sync] Equipment catalog sync process failed: ${error.message}\n`);
  process.exit(1);
}

if (seedEquipment.code !== 0) {
  printCommandOutput("Equipment catalog sync", `${seedEquipment.stdout}${seedEquipment.stderr}`);
  process.stderr.write(
    `[startup-sync] Equipment catalog sync failed${seedEquipment.signal ? ` (${seedEquipment.signal})` : ""} with exit code ${seedEquipment.code ?? "unknown"}.\n`,
  );
  process.exit(seedEquipment.code ?? 1);
}

process.stdout.write("[startup-sync] Equipment catalog synchronized successfully.\n");

// Sincronizar banners
process.stdout.write("[startup-sync] Synchronizing banners...\n");

let seedBanners;
try {
  seedBanners = await runCommand(
    "node",
    ["../../lib/db/scripts/seed-banners.mjs"],
  );
} catch (error) {
  // Banners sync failure is non-fatal
  process.stderr.write(`[startup-sync] Banners sync failed: ${error.message}\n`);
}

if (seedBanners?.code === 0) {
  process.stdout.write("[startup-sync] Banners synchronized successfully.\n");
} else if (seedBanners) {
  printCommandOutput("Banners sync", `${seedBanners.stdout}${seedBanners.stderr}`);
  process.stdout.write("[startup-sync] Banners sync skipped (non-fatal).\n");
}