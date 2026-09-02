import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

function resolveWatermarkPngPath(): string {
  const bundled = fileURLToPath(
    new URL("../assets/brand/offshore-logo.png", import.meta.url),
  );
  const candidates = [
    bundled,
    join(process.cwd(), "src", "assets", "brand", "offshore-logo.png"),
    join(process.cwd(), "public", "offshore-logo.png"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Offshore watermark logo not found (expected public/offshore-logo.png on the server)",
  );
}

const WATERMARK_PNG = resolveWatermarkPngPath();

/** Fraction of the shorter image side used for watermark width */
const IMAGE_WM_SCALE = 0.32;
/** Overall watermark opacity (0–1) */
const IMAGE_WM_OPACITY = 0.44;
/** Center logo opacity for video overlay (0–1) */
const VIDEO_WM_ALPHA = 0.36;
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "3gp", "3g2", "avi", "mkv"]);
const AUDIO_EXTENSIONS = new Set(["m4a", "mp3", "aac", "wav", "ogg"]);

async function getWatermarkPng(targetWidth: number): Promise<Buffer> {
  const width = Math.max(120, Math.round(targetWidth));
  const alpha = Math.round(255 * IMAGE_WM_OPACITY);
  return sharp(WATERMARK_PNG)
    .resize(width)
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

function isVideoFile(fileName: string, contentType: string): boolean {
  if (contentType.startsWith("video/")) return true;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.has(ext);
}

function isAudioFile(fileName: string, contentType: string): boolean {
  if (contentType.startsWith("audio/")) return true;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.has(ext);
}

function outputImageType(contentType: string): "jpeg" | "png" | "webp" | "gif" {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpeg";
}

export async function applyImageWatermark(
  input: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const image = sharp(input, { animated: contentType === "image/gif" });
  const meta = await image.metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const wmWidth = Math.round(Math.min(width, height) * IMAGE_WM_SCALE);
  const watermark = await getWatermarkPng(wmWidth);

  const format = outputImageType(contentType);
  let pipeline = image.composite([
    {
      input: watermark,
      gravity: "center",
      blend: "over",
    },
  ]);

  if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
  } else if (format === "png") {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (format === "webp") {
    pipeline = pipeline.webp({ quality: 88 });
  } else {
    pipeline = pipeline.gif();
  }

  return {
    buffer: await pipeline.toBuffer(),
    contentType:
      format === "jpeg"
        ? "image/jpeg"
        : format === "png"
          ? "image/png"
          : format === "webp"
            ? "image/webp"
            : "image/gif",
  };
}

function runFfmpeg(args: string[]): Promise<void> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary is not available on this platform");
  }
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-800) || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function applyVideoWatermark(
  input: Buffer,
  fileName: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
  const id = crypto.randomUUID();
  const inPath = join(tmpdir(), `${id}-in.${ext}`);
  const wmPath = join(tmpdir(), `${id}-wm.png`);
  const outPath = join(tmpdir(), `${id}-out.${ext}`);

  try {
    await writeFile(inPath, input);
    const wmPng = await getWatermarkPng(420);
    await writeFile(wmPath, wmPng);

    const filter = `[1]format=rgba,colorchannelmixer=aa=${VIDEO_WM_ALPHA}[wm];[0][wm]overlay=(W-w)/2:(H-h)/2:format=auto`;

    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inPath,
      "-i",
      wmPath,
      "-filter_complex",
      filter,
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

    const buffer = await readFile(outPath);
    const contentType =
      ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";
    return { buffer, contentType };
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(wmPath), unlink(outPath)]);
  }
}

export async function applyMediaWatermark(
  input: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (isVideoFile(fileName, contentType)) {
    return applyVideoWatermark(input, fileName);
  }
  if (isAudioFile(fileName, contentType)) {
    return { buffer: input, contentType: contentType || "audio/mp4" };
  }
  return applyImageWatermark(input, contentType);
}

export function isVideoMedia(fileName: string, contentType: string): boolean {
  return isVideoFile(fileName, contentType);
}

export function isAudioMedia(fileName: string, contentType: string): boolean {
  return isAudioFile(fileName, contentType);
}
