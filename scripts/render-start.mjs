/**
 * Render Web Service entrypoint.
 * TanStack Start + Cloudflare plugin outputs dist/server (Worker + static assets).
 * Wrangler serves the built worker on Render's PORT.
 *
 * Wrangler's local runtime (miniflare) does not inherit system env vars,
 * so we write a .dev.vars file that Wrangler reads automatically.
 */
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = path.join(root, "dist", "server", "wrangler.json");
const port = process.env.PORT ?? "10000";

if (!existsSync(config)) {
  console.error(
    `[render-start] Missing ${config}. Run "npm run build" before starting.`,
  );
  process.exit(1);
}

const wranglerJs = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
if (!existsSync(wranglerJs)) {
  console.error("[render-start] wrangler not installed. Run npm install.");
  process.exit(1);
}

const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
  "VITE_SITE_URL",
  "ADMIN_PASSWORD",
  "VITE_GOOGLE_MAPS_API_KEY",
  "VITE_GOOGLE_MAP_ID",
  "GOOGLE_MAPS_API_KEY",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "GEMINI_API_KEY",
  "GOOGLE_AI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GEMINI_MODEL",
  "LOVABLE_API_KEY",
  "LOVABLE_MODEL",
];

const devVarsPath = path.join(root, "dist", "server", ".dev.vars");
const lines = ENV_KEYS
  .filter((key) => process.env[key])
  .map((key) => `${key}=${process.env[key]}`);

if (lines.length > 0) {
  writeFileSync(devVarsPath, lines.join("\n") + "\n", "utf-8");
  console.log(`[render-start] Wrote ${lines.length} env vars to .dev.vars`);
}

console.log(`[render-start] Listening on 0.0.0.0:${port}`);

const child = spawn(
  process.execPath,
  [
    wranglerJs,
    "dev",
    "--config",
    config,
    "--local",
    "--ip",
    "0.0.0.0",
    "--port",
    port,
    "--local-protocol",
    "http",
  ],
  { stdio: "inherit", env: process.env, cwd: path.join(root, "dist", "server") },
);

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
