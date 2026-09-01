/**
 * Fetch API keys for a Supabase project via CLI (requires: npx supabase login).
 * Usage: node scripts/fetch-supabase-keys.mjs jbjntqmamlyohvrbgcc
 */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = process.argv[2];

if (!projectRef) {
  console.error("Usage: node scripts/fetch-supabase-keys.mjs <project-ref>");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "supabase",
    "projects",
    "api-keys",
    "--project-ref",
    projectRef,
    "--reveal",
    "-o",
    "json",
  ],
  { cwd: root, encoding: "utf8", shell: true },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Failed to fetch API keys");
  console.error("\nRun: npx supabase login");
  console.error("Use the account that owns the Website Project (binfred.ke@gmail.com).");
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(result.stdout);
} catch {
  console.error("Unexpected CLI output:", result.stdout);
  process.exit(1);
}

const keys = Array.isArray(parsed) ? parsed : parsed.api_keys ?? parsed.keys ?? [];
const anon = keys.find((k) => k.name === "anon" || k.id === "anon")?.api_key;
const service = keys.find((k) => k.name === "service_role" || k.id === "service_role")?.api_key;

if (!anon || !service) {
  console.error("Could not find anon/service_role keys in:", result.stdout);
  process.exit(1);
}

const out = {
  url: `https://${projectRef}.supabase.co`,
  anon,
  service_role: service,
};
console.log(JSON.stringify(out, null, 2));
