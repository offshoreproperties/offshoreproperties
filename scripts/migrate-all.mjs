/**
 * Full terminal migration: schema → data → storage → URL fix → optional .env swap.
 *
 * Required in .env:
 *   NEW_SUPABASE_URL=https://jbjntqmamlyohvrbgcc.supabase.co
 *   NEW_SUPABASE_PUBLISHABLE_KEY=...
 *   NEW_SUPABASE_SERVICE_ROLE_KEY=...
 *   SUPABASE_DB_URL=postgresql://postgres.jbjntqmamlyohvrbgcc:PASSWORD@...pooler.supabase.com:5432/postgres
 *
 * OLD project is read from current SUPABASE_* keys (already in .env).
 *
 * Run: node scripts/migrate-all.mjs
 * Dry schema only: node scripts/migrate-all.mjs --schema-only
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEW_PROJECT_REF = "jbjntqmamllyohvrbgcc";
const schemaOnly = process.argv.includes("--schema-only");
const skipEnvSwap = process.argv.includes("--skip-env-swap");
const useLinked = process.argv.includes("--linked");

function loadEnv() {
  const path = join(root, ".env");
  if (!existsSync(path)) return { path, lines: [], map: {} };
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i);
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    map[k] = v;
  }
  return { path, lines, map };
}

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function run(cmd, args, label) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: process.env });
  if ((result.status ?? 1) !== 0) fail(`${label} failed (exit ${result.status})`);
}

function fetchKeysFromCli(projectRef) {
  const result = spawnSync("node", ["scripts/fetch-supabase-keys.mjs", projectRef], {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

const { path: envPath, map } = loadEnv();

// Fill NEW_* from Supabase CLI if user logged in but didn't paste keys
if (!map.NEW_SUPABASE_SERVICE_ROLE_KEY || !map.NEW_SUPABASE_PUBLISHABLE_KEY) {
  console.log("Fetching NEW project API keys via Supabase CLI…");
  const keys = fetchKeysFromCli(NEW_PROJECT_REF);
  if (!keys) {
    fail(
      "Could not fetch API keys. Run:\n  npx supabase login\n(use binfred.ke@gmail.com — the account that owns Website Project)\nThen tell me to continue.",
    );
  }
  map.NEW_SUPABASE_URL = keys.url;
  map.NEW_SUPABASE_PUBLISHABLE_KEY = keys.anon;
  map.NEW_SUPABASE_SERVICE_ROLE_KEY = keys.service_role;
  console.log(`  ✓ Got keys for ${keys.url}`);
}

const required = ["NEW_SUPABASE_URL", "NEW_SUPABASE_PUBLISHABLE_KEY", "NEW_SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((k) => !map[k]);
if (missing.length) {
  fail(`Missing: ${missing.join(", ")}`);
}

// Expose NEW keys to child migration scripts
process.env.NEW_SUPABASE_URL = map.NEW_SUPABASE_URL;
process.env.NEW_SUPABASE_SERVICE_ROLE_KEY = map.NEW_SUPABASE_SERVICE_ROLE_KEY;

const newRef = new URL(map.NEW_SUPABASE_URL).hostname.split(".")[0];
if (map.SUPABASE_DB_URL && !map.SUPABASE_DB_URL.includes(newRef)) {
  console.warn(`⚠ SUPABASE_DB_URL does not contain ${newRef} — using linked push instead.`);
}

run("node", ["scripts/check-supabase.mjs", "old"], "Verify OLD project");
run("node", ["scripts/check-supabase.mjs", "new"], "Verify NEW project");

if (useLinked || !map.SUPABASE_DB_URL) {
  console.log("\n=== Link + push schema (CLI) ===\n");
  const link = spawnSync(
    "npx",
    ["supabase", "link", "--project-ref", newRef, "--yes"],
    { cwd: root, stdio: "inherit", shell: true },
  );
  if ((link.status ?? 1) !== 0) {
    fail(
      "Link failed. You may need to enter the database password when prompted.\nRun manually:\n  npx supabase link --project-ref jbjntqmamlyohvrbgcc",
    );
  }
  run("npm", ["run", "db:push:linked"], "Push schema to NEW database");
} else {
  run("npm", ["run", "db:push"], "Push schema to NEW database");
}

if (schemaOnly) {
  console.log("\n✓ Schema pushed. Run without --schema-only to copy data + files.\n");
  process.exit(0);
}

run("node", ["scripts/migrate-supabase.mjs", "--data"], "Copy database rows");
run("node", ["scripts/migrate-supabase.mjs", "--storage"], "Copy storage files");
run("node", ["scripts/migrate-supabase.mjs", "--fix-urls"], "Rewrite image URLs");

if (!skipEnvSwap) {
  console.log("\n=== Switch .env to NEW project ===\n");
  const { lines } = loadEnv();
  const replacements = {
    SUPABASE_URL: map.NEW_SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: map.NEW_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: map.NEW_SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_URL: map.NEW_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: map.NEW_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: newRef,
  };

  const out = lines.map((line) => {
    if (!line || line.startsWith("#")) return line;
    const i = line.indexOf("=");
    if (i < 0) return line;
    const key = line.slice(0, i);
    if (!(key in replacements)) return line;
    return `${key}="${replacements[key]}"`;
  });

  writeFileSync(envPath, out.join("\n") + "\n", "utf8");
  console.log("  ✓ .env updated to new project keys");
  console.log("  → Also update the same vars on Render, then redeploy.\n");
}

run("node", ["scripts/check-supabase.mjs", "new"], "Final check on NEW project");

console.log("\n✓ Migration complete.\n");
