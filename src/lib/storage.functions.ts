import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { applyMediaWatermark, isAudioMedia, isVideoMedia } from "@/lib/watermark";

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/3gpp",
  "video/3gpp2",
  "video/x-m4v",
  "video/x-msvideo",
  "video/x-matroska",
] as const;

const AUDIO_MIME_TYPES = [
  "audio/mp4",
  "audio/webm",
  "audio/mpeg",
  "audio/aac",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
] as const;

const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES] as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export const uploadPropertyImage = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fileName: z.string().min(1).max(200),
        contentType: z.enum(ALLOWED_MIME_TYPES),
        dataBase64: z.string().min(1).max(120_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ext = data.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${Date.now()}-${safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`}`;

    const raw = Buffer.from(data.dataBase64, "base64");
    const isVideo = isVideoMedia(data.fileName, data.contentType);
    const isAudio = isAudioMedia(data.fileName, data.contentType);
    const maxBytes =
      isVideo || isAudio ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (raw.length > maxBytes) {
      throw new Error(
        isVideo || isAudio
          ? `Recording too large (max ${MAX_VIDEO_BYTES / (1024 * 1024)}MB)`
          : `Image too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB)`,
      );
    }

    const { buffer, contentType } = await applyMediaWatermark(
      raw,
      data.fileName,
      data.contentType,
    );

    const { error } = await supabaseAdmin.storage.from("property-images").upload(path, buffer, {
      contentType,
      upsert: false,
      metadata: { watermarked: "true" },
    });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabaseAdmin.storage.from("property-images").getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  });
