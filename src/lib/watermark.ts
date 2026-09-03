import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

/** Fraction of the shorter image side used for watermark width */
const IMAGE_WM_SCALE = 0.24;
/** Must cover stacked logos + grey plates from earlier passes */
const IMAGE_WM_CLEAR_SCALE = 0.72;
/** Fresh stamp size after a clear pass — keep smaller than the clear zone */
const IMAGE_WM_REAPPLY_SCALE = 0.24;
/** Overall watermark opacity (0–1) */
const IMAGE_WM_OPACITY = 0.36;
const IMAGE_WM_REAPPLY_OPACITY = 0.36;
/** Bump when storage metadata is stale — re-run batch script after logo/clear changes */
export const WATERMARK_VERSION = "5";
/** Center logo opacity for video overlay (0–1) */
const VIDEO_WM_ALPHA = 0.34;
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "3gp", "3g2", "avi", "mkv"]);
const AUDIO_EXTENSIONS = new Set(["m4a", "mp3", "aac", "wav", "ogg"]);

let cachedWatermarkPath: string | null | undefined;

function resolveWatermarkPngPath(): string | null {
  if (cachedWatermarkPath !== undefined) return cachedWatermarkPath;

  const bundled = fileURLToPath(
    new URL("../assets/brand/offshore-logo.png", import.meta.url),
  );
  const candidates = [
    bundled,
    join(process.cwd(), "src", "assets", "brand", "offshore-logo.png"),
    join(process.cwd(), "public", "offshore-logo.png"),
    join(process.cwd(), "public", "Offshore Logo (1).png"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      cachedWatermarkPath = candidate;
      return candidate;
    }
  }

  console.warn(
    "[watermark] Logo not found — uploads will continue without a watermark until public/offshore-logo.png is available.",
  );
  cachedWatermarkPath = null;
  return null;
}

async function getWatermarkPng(
  targetWidth: number,
  opacity = IMAGE_WM_OPACITY,
  maxWidth?: number,
  maxHeight?: number,
): Promise<Buffer | null> {
  const path = resolveWatermarkPngPath();
  if (!path) return null;

  const width = Math.max(48, Math.round(targetWidth));
  const alpha = Math.round(255 * opacity);
  const fitW =
    maxWidth != null && maxHeight != null
      ? Math.max(24, Math.min(width, maxWidth - 4, maxHeight - 4))
      : width;
  const fitH = maxHeight != null ? Math.max(24, maxHeight - 4) : undefined;
  // Trim transparent padding so the visible mark matches the requested width.
  return sharp(path)
    .trim({ threshold: 8 })
    .resize({
      width: fitW,
      ...(fitH != null ? { height: fitH } : {}),
      fit: "inside",
      withoutEnlargement: false,
    })
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
  if (contentType === "image/png" || contentType === "image/x-png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpeg";
}

async function passthroughImage(
  input: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const format = outputImageType(contentType);
  const image = sharp(input, { animated: contentType === "image/gif" });
  let pipeline = image;
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

/**
 * Fully cover stacked center watermarks / grey plates.
 * Heals from surrounding pixels with an opaque core so old logos cannot show through.
 */
async function clearExistingWatermarkZone(input: Buffer, contentType: string): Promise<Buffer> {
  const meta = await sharp(input, { animated: contentType === "image/gif" }).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const shortSide = Math.min(width, height);

  const patchW = Math.min(width, Math.max(32, Math.round(shortSide * IMAGE_WM_CLEAR_SCALE)));
  const patchH = Math.min(height, Math.max(32, Math.round(shortSide * IMAGE_WM_CLEAR_SCALE * 0.82)));
  const left = Math.max(0, Math.round((width - patchW) / 2));
  const top = Math.max(0, Math.round((height - patchH) / 2));

  const band = Math.max(32, Math.round(shortSide * 0.14));
  const strips: Buffer[] = [];

  const pushStrip = async (region: { left: number; top: number; width: number; height: number }) => {
    if (region.width < 4 || region.height < 4) return;
    const buf = await sharp(input, { animated: contentType === "image/gif" })
      .extract(region)
      .resize(patchW, patchH, { fit: "fill" })
      .blur(22)
      .png()
      .toBuffer();
    strips.push(buf);
  };

  await pushStrip({
    left,
    top: Math.max(0, top - band),
    width: patchW,
    height: Math.min(band, top),
  });
  await pushStrip({
    left,
    top: Math.min(height - 1, top + patchH),
    width: patchW,
    height: Math.min(band, height - (top + patchH)),
  });
  await pushStrip({
    left: Math.max(0, left - band),
    top,
    width: Math.min(band, left),
    height: patchH,
  });
  await pushStrip({
    left: Math.min(width - 1, left + patchW),
    top,
    width: Math.min(band, width - (left + patchW)),
    height: patchH,
  });

  if (!strips.length) {
    const fallback = await sharp(input, { animated: contentType === "image/gif" })
      .blur(50)
      .extract({ left, top, width: patchW, height: patchH })
      .png()
      .toBuffer();
    strips.push(fallback);
  }

  let heal = await sharp(strips[0]).removeAlpha().png().toBuffer();
  for (let i = 1; i < strips.length; i++) {
    const faded = await sharp(strips[i])
      .ensureAlpha()
      .composite([
        {
          input: Buffer.from([255, 255, 255, 90]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();
    heal = await sharp(heal).composite([{ input: faded, blend: "over" }]).png().toBuffer();
  }

  // Opaque core (old marks cannot bleed through) + short feather so there is no hard box.
  const featherRadius = Math.max(10, Math.round(Math.min(patchW, patchH) * 0.06));
  const coreW = Math.max(8, patchW - featherRadius * 2);
  const coreH = Math.max(8, patchH - featherRadius * 2);
  const mask = await sharp({
    create: {
      width: patchW,
      height: patchH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: coreW,
            height: coreH,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .blur(featherRadius)
          .png()
          .toBuffer(),
        gravity: "center",
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  const healOpaque = await sharp(heal)
    .resize(patchW, patchH, { fit: "fill" })
    .blur(8)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp(input, { animated: contentType === "image/gif" })
    .composite([{ input: healOpaque, left, top, blend: "over" }])
    .toBuffer();
}

export async function applyImageWatermark(
  input: Buffer,
  contentType: string,
  options?: { replaceExisting?: boolean },
): Promise<{ buffer: Buffer; contentType: string; watermarked: boolean }> {
  const replaceExisting = options?.replaceExisting === true;
  const scale = replaceExisting ? IMAGE_WM_REAPPLY_SCALE : IMAGE_WM_SCALE;
  const opacity = replaceExisting ? IMAGE_WM_REAPPLY_OPACITY : IMAGE_WM_OPACITY;

  let source = input;
  if (replaceExisting) {
    try {
      // Two clear passes so stacked logos / grey plates are fully covered.
      source = await clearExistingWatermarkZone(input, contentType);
      source = await clearExistingWatermarkZone(source, contentType);
    } catch (err) {
      console.warn("[watermark] clear skipped:", err);
      source = input;
    }
  }

  const image = sharp(source, { animated: contentType === "image/gif" });
  const meta = await image.metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const wmWidth = Math.round(Math.min(width, height) * scale);
  const watermark = await getWatermarkPng(wmWidth, opacity, width, height);

  if (!watermark) {
    const passthrough = await passthroughImage(input, contentType);
    return { ...passthrough, watermarked: false };
  }

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
    watermarked: true,
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
  options?: { replaceExisting?: boolean },
): Promise<{ buffer: Buffer; contentType: string; watermarked: boolean }> {
  const replaceExisting = options?.replaceExisting === true;
  const opacity = replaceExisting ? IMAGE_WM_REAPPLY_OPACITY : VIDEO_WM_ALPHA;
  const wmSize = replaceExisting ? 480 : 420;

  const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
  const contentType =
    ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";

  const wmPng = await getWatermarkPng(wmSize, opacity);
  if (!wmPng || !ffmpegPath) {
    return { buffer: input, contentType, watermarked: false };
  }

  const id = crypto.randomUUID();
  const inPath = join(tmpdir(), `${id}-in.${ext}`);
  const wmPath = join(tmpdir(), `${id}-wm.png`);
  const outPath = join(tmpdir(), `${id}-out.${ext}`);

  try {
    await writeFile(inPath, input);
    await writeFile(wmPath, wmPng);

    const filter = `[1]format=rgba,colorchannelmixer=aa=${opacity}[wm];[0][wm]overlay=(W-w)/2:(H-h)/2:format=auto`;

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
    return { buffer, contentType, watermarked: true };
  } catch (error) {
    console.warn("[watermark] Video watermark failed — uploading original:", error);
    return { buffer: input, contentType, watermarked: false };
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(wmPath), unlink(outPath)]);
  }
}

export async function applyMediaWatermark(
  input: Buffer,
  fileName: string,
  contentType: string,
  options?: { replaceExisting?: boolean },
): Promise<{ buffer: Buffer; contentType: string; watermarked: boolean }> {
  const normalized = contentType.toLowerCase();
  if (normalized === "image/heic" || normalized === "image/heif") {
    return { buffer: input, contentType, watermarked: false };
  }

  try {
    if (isVideoFile(fileName, contentType)) {
      return applyVideoWatermark(input, fileName, options);
    }
    if (isAudioFile(fileName, contentType)) {
      return { buffer: input, contentType: contentType || "audio/mp4", watermarked: false };
    }
    return applyImageWatermark(input, contentType, options);
  } catch (error) {
    console.warn("[watermark] Media processing failed — uploading original:", error);
    if (isVideoFile(fileName, contentType) || isAudioFile(fileName, contentType)) {
      return { buffer: input, contentType, watermarked: false };
    }
    try {
      const passthrough = await passthroughImage(input, contentType);
      return { ...passthrough, watermarked: false };
    } catch {
      return { buffer: input, contentType, watermarked: false };
    }
  }
}

export function isVideoMedia(fileName: string, contentType: string): boolean {
  return isVideoFile(fileName, contentType);
}

export function isAudioMedia(fileName: string, contentType: string): boolean {
  return isAudioFile(fileName, contentType);
}
