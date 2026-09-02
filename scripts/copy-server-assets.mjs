/**
 * Copy server-only assets into the SSR bundle output (Render / Node).
 * Vite does not always emit files referenced via import.meta.url for PNGs.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src", "assets", "brand", "offshore-logo.png");
const destDir = join(root, "dist", "server", "assets", "brand");
const dest = join(destDir, "offshore-logo.png");

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);
console.log(`[copy-server-assets] ${dest}`);
