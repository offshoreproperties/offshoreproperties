import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const MAX_UPLOAD_BASE64_LENGTH = 14_000_000;
/** Skip server-side watermark above this size to avoid Render OOM / HTML 500s. */
const MAX_WATERMARK_BYTES = 8 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  webm: "video/webm",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
};

function normalizeUploadContentType(contentType: string, fileName: string): string | null {
  const type = contentType?.toLowerCase().trim() ?? "";
  if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
  if (type === "image/x-png") return "image/png";
  if (Object.values(EXT_TO_MIME).includes(type)) return type;
  if (type.startsWith("image/")) {
    if (type.includes("jpeg") || type.includes("jpg")) return "image/jpeg";
    if (type.includes("png")) return "image/png";
    if (type.includes("webp")) return "image/webp";
    if (type.includes("gif")) return "image/gif";
    if (type.includes("heic") || type.includes("heif")) return "image/heic";
  }
  if (type.startsWith("video/")) return "video/mp4";
  if (type.startsWith("audio/")) return "audio/mp4";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? null;
}

function storagePath(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${Date.now()}-${safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`}`;
}

function publicUrlFor(path: string): string {
  const { data: urlData } = supabaseAdmin.storage.from("property-images").getPublicUrl(path);
  return urlData.publicUrl;
}

const MetaSchema = z
  .object({
    fileName: z.string().min(1).max(200),
    contentType: z.string().min(1).max(120),
    fileSize: z.number().int().positive().max(MAX_VIDEO_BYTES),
  })
  .transform((data) => {
    const contentType = normalizeUploadContentType(data.contentType, data.fileName);
    if (!contentType) {
      throw new Error(`Unsupported file type. Use JPG, PNG, WebP, HEIC, or MP4.`);
    }
    const isVideo = contentType.startsWith("video/");
    const isAudio = contentType.startsWith("audio/");
    const maxBytes = isVideo || isAudio ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (data.fileSize > maxBytes) {
      throw new Error(
        isVideo || isAudio
          ? `File too large (max ${MAX_VIDEO_BYTES / (1024 * 1024)}MB)`
          : `Photo too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB)`,
      );
    }
    return { ...data, contentType };
  });

/** Step 1 — client uploads bytes directly to Supabase (no base64 through our server). */
export const createPropertyUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => MetaSchema.parse(input))
  .handler(async ({ data }) => {
    const path = storagePath(data.fileName);
    const { data: signed, error } = await supabaseAdmin.storage
      .from("property-images")
      .createSignedUploadUrl(path);

    if (error || !signed?.signedUrl) {
      console.error("[upload] createSignedUploadUrl failed:", error);
      throw new Error(
        error?.message?.includes("not found")
          ? "Storage bucket missing — contact support."
          : error?.message || "Could not start upload — try again.",
      );
    }

    return {
      signedUrl: signed.signedUrl,
      token: signed.token,
      path,
      publicUrl: publicUrlFor(path),
      contentType: data.contentType,
    };
  });

async function tryWatermark(
  raw: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string; watermarked: boolean }> {
  if (raw.length > MAX_WATERMARK_BYTES) {
    return { buffer: raw, contentType, watermarked: false };
  }
  try {
    const { applyMediaWatermark } = await import("@/lib/watermark");
    const result = await applyMediaWatermark(raw, fileName, contentType);
    return {
      buffer: result.buffer,
      contentType: result.contentType,
      watermarked: result.watermarked,
    };
  } catch (err) {
    console.error("[upload] watermark failed, keeping original:", err);
    return { buffer: raw, contentType, watermarked: false };
  }
}

/** Step 2 — optional watermark pass after direct upload. Never fails the upload. */
export const finalizePropertyUpload = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        path: z.string().min(1).max(300),
        fileName: z.string().min(1).max(200),
        contentType: z.string().min(1).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const fallbackUrl = publicUrlFor(data.path);

    try {
      const { data: blob, error: dlError } = await supabaseAdmin.storage
        .from("property-images")
        .download(data.path);

      if (dlError || !blob) {
        console.error("[upload] download for watermark failed:", dlError);
        return { url: fallbackUrl, watermarked: false };
      }

      const raw = Buffer.from(await blob.arrayBuffer());
      const result = await tryWatermark(raw, data.fileName, data.contentType);

      if (result.watermarked) {
        const { WATERMARK_VERSION } = await import("@/lib/watermark");
        const { error: upError } = await supabaseAdmin.storage
          .from("property-images")
          .upload(data.path, result.buffer, {
            contentType: result.contentType,
            upsert: true,
            metadata: { watermarked: "true", watermarkVersion: WATERMARK_VERSION },
          });
        if (upError) {
          console.error("[upload] watermark re-upload failed:", upError);
        }
      }

      return { url: publicUrlFor(data.path), watermarked: result.watermarked };
    } catch (err) {
      console.error("[upload] finalize failed — returning original URL:", err);
      return { url: fallbackUrl, watermarked: false };
    }
  });

/** Legacy / fallback upload through our server (small images). */
export const uploadPropertyImage = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => {
    const parsed = z
      .object({
        fileName: z.string().min(1).max(200),
        contentType: z.string().min(1).max(120),
        dataBase64: z.string().min(1).max(MAX_UPLOAD_BASE64_LENGTH),
      })
      .parse(input);
    const contentType = normalizeUploadContentType(parsed.contentType, parsed.fileName);
    if (!contentType) {
      throw new Error(`Unsupported file type. Use JPG, PNG, WebP, HEIC, or MP4.`);
    }
    return { ...parsed, contentType };
  })
  .handler(async ({ data }) => {
    const path = storagePath(data.fileName);

    let raw: Buffer;
    try {
      raw = Buffer.from(data.dataBase64, "base64");
    } catch {
      throw new Error("Invalid upload data — please try selecting the file again.");
    }

    if (!raw.length) throw new Error("Empty file — choose a different photo or recording.");

    const isVideo = data.contentType.startsWith("video/");
    const isAudio = data.contentType.startsWith("audio/");
    const maxBytes = isVideo || isAudio ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (raw.length > maxBytes) {
      throw new Error(
        isVideo || isAudio
          ? `Recording too large (max ${MAX_VIDEO_BYTES / (1024 * 1024)}MB)`
          : `Photo too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB)`,
      );
    }

    const result = await tryWatermark(raw, data.fileName, data.contentType);
    let watermarkVersion = "0";
    if (result.watermarked) {
      try {
        const { WATERMARK_VERSION } = await import("@/lib/watermark");
        watermarkVersion = WATERMARK_VERSION;
      } catch {
        watermarkVersion = "3";
      }
    }

    const { error } = await supabaseAdmin.storage.from("property-images").upload(path, result.buffer, {
      contentType: result.contentType,
      upsert: false,
      metadata: {
        watermarked: result.watermarked ? "true" : "false",
        watermarkVersion,
      },
    });

    if (error) {
      console.error("[upload] Supabase storage error:", error);
      throw new Error(error.message || "Storage upload failed — try again in a moment.");
    }

    return { url: publicUrlFor(path), path };
  });
