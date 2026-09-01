import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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
        const k = l.slice(0, i);
        let v = l.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return [k, v];
      }),
  );
}

const env = { ...loadEnv(), ...process.env };
const label = process.argv[2] || "current";

let url;
let key;
if (label === "new") {
  url = env.NEW_SUPABASE_URL;
  key = env.NEW_SUPABASE_SERVICE_ROLE_KEY;
} else if (label === "old") {
  url = env.OLD_SUPABASE_URL || env.SUPABASE_URL;
  key = env.OLD_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
} else {
  url = env.SUPABASE_URL;
  key = env.SUPABASE_SERVICE_ROLE_KEY;
}

if (!url || !key) {
  console.error(`Missing URL/key for ${label}`);
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });
const { count } = await client.from("properties").select("*", { count: "exact", head: true });
const { data: files, error: fe } = await client.storage.from("property-images").list("", { limit: 10 });

console.log(`Project: ${new URL(url).hostname}`);
console.log(`Properties: ${count ?? "?"}`);
console.log(`Storage files (top-level): ${files?.length ?? 0}${fe ? ` (${fe.message})` : ""}`);
