/**
 * Apply Offshore logo watermark to all existing property-images in Supabase storage.
 *
 *   node scripts/watermark-existing.mjs
 *   node scripts/watermark-existing.mjs --dry-run
 *   node scripts/watermark-existing.mjs --force   # re-apply new logo on already-watermarked files
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 * Skips files already at the current watermark version unless --force is passed.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import ffmpegPath from "ffmpeg-static";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "property-images";
const WATERMARK_VERSION = "2";
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

const LOGO_CANDIDATES = [
  join(root, "src", "assets", "brand", "offshore-logo.png"),
  join(root, "public", "offshore-logo.png"),
  join(root, "public", "Offshore Logo (1).png"),
];

const WATERMARK_PNG = LOGO_CANDIDATES.find((p) => existsSync(p));

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
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!WATERMARK_PNG) {
  console.error("Logo not found — place offshore-logo.png in public/ or src/assets/brand/");
  process.exit(1);
}

console.log(`Using logo: ${WATERMARK_PNG}`);
console.log(`Watermark version: ${WATERMARK_VERSION}${force ? " (--force)" : ""}\n`);

const db = createClient(url, key, { auth: { persistSession: false } });

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "m4v"]);

const IMAGE_WM_SCALE = 0.32;
const IMAGE_WM_REAPPLY_SCALE = 0.36;
const IMAGE_WM_OPACITY = 0.44;
const IMAGE_WM_REAPPLY_OPACITY = 0.52;

async function watermarkPng(width, opacity) {
  const w = Math.max(120, width);
  const alpha = Math.round(255 * opacity);
  return sharp(WATERMARK_PNG)
    .resize(w)
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([255, 255, 255, alpha]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}

async function softenExistingWatermarkZone(buffer, ext) {
  const image = sharp(buffer, { animated: ext === "gif" });
  const meta = await image.metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const patchW = Math.round(Math.min(width, height) * IMAGE_WM_REAPPLY_SCALE * 1.1);
  const patchH = Math.round(patchW * 0.55);
  const patch = await sharp({
    create: {
      width: patchW,
      height: patchH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0.38 },
    },
  })
    .blur(12)
    .png()
    .toBuffer();
  return image.composite([{ input: patch, gravity: "center", blend: "over" }]).toBuffer();
}

async function watermarkImage(buffer, ext, replaceExisting) {
  let source = buffer;
  if (replaceExisting) {
    try {
      source = await softenExistingWatermarkZone(buffer, ext);
    } catch {
      source = buffer;
    }
  }

  const scale = replaceExisting ? IMAGE_WM_REAPPLY_SCALE : IMAGE_WM_SCALE;
  const opacity = replaceExisting ? IMAGE_WM_REAPPLY_OPACITY : IMAGE_WM_OPACITY;
  const image = sharp(source, { animated: ext === "gif" });
  const meta = await image.metadata();
  const w = meta.width ?? 1200;
  const h = meta.height ?? 800;
  const wm = await watermarkPng(Math.round(Math.min(w, h) * scale), opacity);
  let pipeline = image.composite([{ input: wm, gravity: "center", blend: "over" }]);
  if (ext === "png") pipeline = pipeline.png();
  else if (ext === "webp") pipeline = pipeline.webp({ quality: 88 });
  else if (ext === "gif") pipeline = pipeline.gif();
  else pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
  return pipeline.toBuffer();
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-500) || `ffmpeg exit ${code}`));
    });
  });
}

async function watermarkVideo(buffer, ext, replaceExisting) {
  const opacity = replaceExisting ? IMAGE_WM_REAPPLY_OPACITY : 0.36;
  const wmSize = replaceExisting ? 480 : 420;
  const id = crypto.randomUUID();
  const inPath = join(tmpdir(), `${id}-in.${ext}`);
  const wmPath = join(tmpdir(), `${id}-wm.png`);
  const outPath = join(tmpdir(), `${id}-out.${ext}`);
  try {
    await writeFile(inPath, buffer);
    await writeFile(wmPath, await watermarkPng(wmSize, opacity));
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inPath,
      "-i",
      wmPath,
      "-filter_complex",
      `[1]format=rgba,colorchannelmixer=aa=${opacity}[wm];[0][wm]overlay=(W-w)/2:(H-h)/2:format=auto`,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      "-y",
      outPath,
    ]);
    return readFile(outPath);
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(wmPath), unlink(outPath)]);
  }
}

async function listAllFiles(prefix = "") {
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  const files = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      files.push(...(await listAllFiles(path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

function contentTypeFor(ext) {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  return "image/jpeg";
}

async function fileMetadata(path) {
  const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  const name = path.split("/").pop();
  const { data } = await db.storage.from(BUCKET).list(folder, { search: name, limit: 1 });
  return data?.[0]?.metadata ?? {};
}

async function main() {
  console.log(dryRun ? "DRY RUN — no uploads\n" : force ? "Re-watermarking all storage files…\n" : "Watermarking existing storage files…\n");
  const paths = await listAllFiles();
  let done = 0;
  let skipped = 0;

  for (const path of paths) {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const isImage = IMAGE_EXT.has(ext);
    const isVideo = VIDEO_EXT.has(ext);
    if (!isImage && !isVideo) {
      skipped++;
      continue;
    }

    const meta = await fileMetadata(path);
    const version = meta?.watermarkVersion ?? (meta?.watermarked === "true" ? "1" : "0");
    const replaceExisting = force || version !== WATERMARK_VERSION;

    if (!force && version === WATERMARK_VERSION) {
      console.log(`skip (v${version}): ${path}`);
      skipped++;
      continue;
    }

    const { data: blob, error: dlErr } = await db.storage.from(BUCKET).download(path);
    if (dlErr || !blob) {
      console.error(`download failed: ${path}`, dlErr?.message);
      continue;
    }
    const input = Buffer.from(await blob.arrayBuffer());
    console.log(`processing${replaceExisting ? " (replace)" : ""}: ${path} (${(input.length / 1024).toFixed(0)} KB)`);

    if (dryRun) {
      done++;
      continue;
    }

    const output = isVideo
      ? await watermarkVideo(input, ext, replaceExisting)
      : await watermarkImage(input, ext, replaceExisting);
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, output, {
      contentType: contentTypeFor(ext),
      upsert: true,
      metadata: { watermarked: "true", watermarkVersion: WATERMARK_VERSION },
    });
    if (upErr) {
      console.error(`upload failed: ${path}`, upErr.message);
      continue;
    }
    done++;
    console.log(`  ✓ watermarked (v${WATERMARK_VERSION})`);
  }

  console.log(`\nDone. Processed: ${done}, skipped: ${skipped}, total listed: ${paths.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
