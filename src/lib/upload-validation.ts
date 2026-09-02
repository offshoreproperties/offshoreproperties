import { z } from "zod";

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
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

export type UploadContentType =
  | (typeof IMAGE_MIME_TYPES)[number]
  | (typeof VIDEO_MIME_TYPES)[number]
  | (typeof AUDIO_MIME_TYPES)[number];

const EXT_TO_MIME: Record<string, UploadContentType> = {
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

const ALL_MIME = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES] as const;

export function normalizeUploadContentType(
  contentType: string,
  fileName: string,
): UploadContentType | null {
  const type = contentType?.toLowerCase().trim() ?? "";
  if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
  if (type === "image/x-png") return "image/png";
  if ((ALL_MIME as readonly string[]).includes(type)) return type as UploadContentType;

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

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

/** ~10MB file as base64 plus JSON overhead */
export const MAX_UPLOAD_BASE64_LENGTH = 14_000_000;

export const UploadInputSchema = z
  .object({
    fileName: z.string().min(1).max(200),
    contentType: z.string().min(1).max(120),
    dataBase64: z.string().min(1).max(MAX_UPLOAD_BASE64_LENGTH),
  })
  .transform((data) => {
    const contentType = normalizeUploadContentType(data.contentType, data.fileName);
    if (!contentType) {
      throw new Error(`Unsupported file type (${data.contentType || "unknown"}). Use JPG, PNG, WebP, or MP4.`);
    }
    return { ...data, contentType };
  });

export { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, AUDIO_MIME_TYPES };
