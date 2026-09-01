/**
 * Migrate data + storage from an old Supabase project to a new one.
 *
 * Setup (add to .env temporarily — do not commit):
 *   OLD_SUPABASE_URL=https://gdoalzqtopkjttvktnhj.supabase.co
 *   OLD_SUPABASE_SERVICE_ROLE_KEY=...
 *   NEW_SUPABASE_URL=https://jbjntqmamlyohvrbgcc.supabase.co
 *   NEW_SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Order:
 *   1. Point SUPABASE_DB_URL at the NEW project, then: npm run db:push
 *   2. node scripts/migrate-supabase.mjs --data
 *   3. node scripts/migrate-supabase.mjs --storage
 *   4. node scripts/migrate-supabase.mjs --fix-urls
 *   5. Update .env + Render to NEW keys only, restart app
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "property-images";

const TABLES = [
  "agents",
  "properties",
  "leads",
  "bookings",
  "property_views",
  "email_logs",
  "oauth_admin_emails",
];

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

// Default OLD_* from current app Supabase config if not set explicitly
if (!env.OLD_SUPABASE_URL && env.SUPABASE_URL) env.OLD_SUPABASE_URL = env.SUPABASE_URL;
if (!env.OLD_SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY) {
  env.OLD_SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
}

function requireEnv(name) {
  const v = env[name];
  if (!v) {
    console.error(`Missing ${name}. Add it to .env for the migration.`);
    process.exit(1);
  }
  return v;
}

const oldUrl = requireEnv("OLD_SUPABASE_URL");
const oldKey = requireEnv("OLD_SUPABASE_SERVICE_ROLE_KEY");
const newUrl = requireEnv("NEW_SUPABASE_URL");
const newKey = requireEnv("NEW_SUPABASE_SERVICE_ROLE_KEY");

const oldRef = new URL(oldUrl).hostname.split(".")[0];
const newRef = new URL(newUrl).hostname.split(".")[0];

const oldDb = createClient(oldUrl, oldKey, { auth: { persistSession: false } });
const newDb = createClient(newUrl, newKey, { auth: { persistSession: false } });

const flags = new Set(process.argv.slice(2));
const runAll = flags.size === 0;

async function migrateData() {
  console.log("\n=== Migrating public tables ===\n");

  for (const table of TABLES) {
    const { data: rows, error } = await oldDb.from(table).select("*");
    if (error) {
      console.error(`  ✗ ${table}: read failed — ${error.message}`);
      continue;
    }
    if (!rows?.length) {
      console.log(`  · ${table}: empty, skipped`);
      continue;
    }

    const conflictKey = table === "oauth_admin_emails" ? "email" : "id";
    const { error: insertError } = await newDb.from(table).upsert(rows, { onConflict: conflictKey });
    if (insertError) {
      console.error(`  ✗ ${table}: ${insertError.message}`);
      continue;
    }
    console.log(`  ✓ ${table}: ${rows.length} row(s)`);
  }

  console.log("\nNote: property_likes / property_saves / user_roles need auth.users.");
  console.log("Users must sign up again on the new project, or export auth.users via SQL.\n");
}

async function listAllFiles(client, prefix = "") {
  const { data, error } = await client.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`list ${prefix || "/"}: ${error.message}`);

  const files = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      files.push(...(await listAllFiles(client, path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function migrateStorage() {
  console.log("\n=== Migrating storage bucket: property-images ===\n");

  const { data: bucket, error: bucketError } = await newDb.storage.getBucket(BUCKET);
  if (bucketError || !bucket) {
    console.log("  Creating public bucket on new project…");
    const { error: createError } = await newDb.storage.createBucket(BUCKET, { public: true });
    if (createError && !createError.message.includes("already exists")) {
      throw new Error(createError.message);
    }
  }

  const files = await listAllFiles(oldDb);
  if (!files.length) {
    console.log("  No files in old bucket.");
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const path of files) {
    const { data: blob, error: dlError } = await oldDb.storage.from(BUCKET).download(path);
    if (dlError) {
      console.error(`  ✗ download ${path}: ${dlError.message}`);
      fail++;
      continue;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const { error: upError } = await newDb.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: blob.type || undefined,
    });
    if (upError) {
      console.error(`  ✗ upload ${path}: ${upError.message}`);
      fail++;
      continue;
    }
    ok++;
    process.stdout.write(`\r  Copied ${ok}/${files.length}…`);
  }

  console.log(`\n  Done: ${ok} copied, ${fail} failed.\n`);
}

function rewriteUrl(url) {
  if (!url || typeof url !== "string") return url;
  return url.replaceAll(`https://${oldRef}.supabase.co`, `https://${newRef}.supabase.co`);
}

async function fixUrls() {
  console.log("\n=== Rewriting image URLs in properties + agents ===\n");

  const { data: properties, error } = await newDb.from("properties").select("id, images, hero_image");
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const p of properties ?? []) {
    const images = (p.images ?? []).map(rewriteUrl);
    const hero_image = rewriteUrl(p.hero_image);
    const changed =
      JSON.stringify(images) !== JSON.stringify(p.images) || hero_image !== p.hero_image;
    if (!changed) continue;

    const { error: patchError } = await newDb
      .from("properties")
      .update({ images, hero_image })
      .eq("id", p.id);
    if (patchError) {
      console.error(`  ✗ property ${p.id}: ${patchError.message}`);
      continue;
    }
    updated++;
  }

  const { data: agents } = await newDb.from("agents").select("id, photo_url");
  for (const a of agents ?? []) {
    const photo_url = rewriteUrl(a.photo_url);
    if (photo_url === a.photo_url) continue;
    await newDb.from("agents").update({ photo_url }).eq("id", a.id);
    updated++;
  }

  console.log(`  ✓ Updated ${updated} record(s) (${oldRef} → ${newRef}).\n`);
}

async function main() {
  console.log(`Old: ${oldRef}`);
  console.log(`New: ${newRef}`);

  if (runAll || flags.has("--data")) await migrateData();
  if (runAll || flags.has("--storage")) await migrateStorage();
  if (runAll || flags.has("--fix-urls")) await fixUrls();

  if (!runAll && !flags.has("--data") && !flags.has("--storage") && !flags.has("--fix-urls")) {
    console.log(`
Usage:
  node scripts/migrate-supabase.mjs --data      # copy public table rows
  node scripts/migrate-supabase.mjs --storage   # copy property-images bucket
  node scripts/migrate-supabase.mjs --fix-urls  # rewrite Supabase URLs in DB
  node scripts/migrate-supabase.mjs             # run all three
`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
