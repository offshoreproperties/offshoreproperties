import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { applyMediaWatermark, isAudioMedia, isVideoMedia } from "@/lib/watermark";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  UploadInputSchema,
} from "@/lib/upload-validation";

export const uploadPropertyImage = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => UploadInputSchema.parse(input))
  .handler(async ({ data }) => {
    const ext = data.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${Date.now()}-${safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`}`;

    let raw: Buffer;
    try {
      raw = Buffer.from(data.dataBase64, "base64");
    } catch {
      throw new Error("Invalid upload data — please try selecting the file again.");
    }

    if (!raw.length) {
      throw new Error("Empty file — choose a different photo or recording.");
    }

    const isVideo = isVideoMedia(data.fileName, data.contentType);
    const isAudio = isAudioMedia(data.fileName, data.contentType);
    const maxBytes = isVideo || isAudio ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (raw.length > maxBytes) {
      throw new Error(
        isVideo || isAudio
          ? `Recording too large (max ${MAX_VIDEO_BYTES / (1024 * 1024)}MB)`
          : `Image too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB) — try a smaller photo`,
      );
    }

    let buffer: Buffer;
    let contentType: string;
    let watermarked = false;

    try {
      const result = await applyMediaWatermark(raw, data.fileName, data.contentType);
      buffer = result.buffer;
      contentType = result.contentType;
      watermarked = result.watermarked;
    } catch (error) {
      console.error("[upload] Watermark step failed, storing original file:", error);
      buffer = raw;
      contentType = data.contentType;
    }

    const { error } = await supabaseAdmin.storage.from("property-images").upload(path, buffer, {
      contentType,
      upsert: false,
      metadata: { watermarked: watermarked ? "true" : "false" },
    });

    if (error) {
      console.error("[upload] Supabase storage error:", error);
      throw new Error(error.message || "Storage upload failed — try again in a moment.");
    }

    const { data: urlData } = supabaseAdmin.storage.from("property-images").getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  });
