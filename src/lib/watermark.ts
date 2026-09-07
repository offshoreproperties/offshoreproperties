import sharp from "sharp";
export const WATERMARK_VERSION = "plain-1";
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "3gp", "3g2", "avi", "mkv"]);
const AUDIO_EXTENSIONS = new Set(["m4a", "mp3", "aac", "wav", "ogg"]);

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

export async function applyImageWatermark(
  input: Buffer,
  contentType: string,
  _options?: { replaceExisting?: boolean },
): Promise<{ buffer: Buffer; contentType: string; watermarked: boolean }> {
  const passthrough = await passthroughImage(input, contentType);
  return { ...passthrough, watermarked: false };
}

export async function applyVideoWatermark(
  input: Buffer,
  fileName: string,
  _options?: { replaceExisting?: boolean },
): Promise<{ buffer: Buffer; contentType: string; watermarked: boolean }> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
  const contentType =
    ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";
  return { buffer: input, contentType, watermarked: false };
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
