/**
 * Quick upload smoke test — run: node scripts/test-upload.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env");
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      }),
  );
}

const env = { ...loadEnv(), ...process.env };
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

// 1x1 red PNG
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function testDirectStorage() {
  const path = `test-${Date.now()}.png`;
  const { error } = await supabase.storage.from("property-images").upload(path, tinyPng, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) {
    console.error("Direct storage upload FAILED:", error);
    return false;
  }
  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  console.log("Direct storage upload OK:", data.publicUrl);
  await supabase.storage.from("property-images").remove([path]);
  return true;
}

async function testSharp() {
  try {
    const out = await sharp(tinyPng).jpeg({ quality: 88 }).toBuffer();
    console.log("Sharp OK, output bytes:", out.length);
    return true;
  } catch (e) {
    console.error("Sharp FAILED:", e);
    return false;
  }
}

async function testServerFn() {
  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("Skip server fn test — no ADMIN_PASSWORD");
    return;
  }
  const base64 = tinyPng.toString("base64");
  const body = JSON.stringify({
    data: {
      fileName: "test.png",
      contentType: "image/png",
      dataBase64: base64,
    },
  });

  const res = await fetch("http://localhost:8081/_serverFn/uploadPropertyImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminPassword}`,
    },
    body,
  });

  const text = await res.text();
  console.log("Server fn status:", res.status);
  console.log("Server fn body:", text.slice(0, 500));
}

async function main() {
  console.log("=== Upload diagnostics ===");
  await testSharp();
  await testDirectStorage();
  await testServerFn();
}

main().catch(console.error);
