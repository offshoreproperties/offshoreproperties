const VIDEO_EXT = /\.(mp4|webm|mov|m4v|3gp|3g2|avi|mkv)(\?|#|$)/i;
const AUDIO_EXT = /\.(m4a|mp3|aac|wav|ogg|webm)(\?|#|$)/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

export function isAudioUrl(url: string): boolean {
  return AUDIO_EXT.test(url) && !VIDEO_EXT.test(url);
}

export const IMAGE_UPLOAD_MIME = [
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

export const VIDEO_UPLOAD_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/3gpp",
  "video/3gpp2",
  "video/x-m4v",
  "video/x-msvideo",
  "video/x-matroska",
] as const;

export const AUDIO_UPLOAD_MIME = [
  "audio/mp4",
  "audio/webm",
  "audio/mpeg",
  "audio/aac",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
] as const;

export type PropertyUploadMime =
  | (typeof IMAGE_UPLOAD_MIME)[number]
  | (typeof VIDEO_UPLOAD_MIME)[number]
  | (typeof AUDIO_UPLOAD_MIME)[number];

const EXT_TO_MIME: Record<string, PropertyUploadMime> = {
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

/** File picker accept list — photos, videos, and audio recordings. */
export const PROPERTY_MEDIA_ACCEPT = [
  ...IMAGE_UPLOAD_MIME,
  ...VIDEO_UPLOAD_MIME,
  ...AUDIO_UPLOAD_MIME,
  "image/*",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
  "video/*",
  "audio/*",
].join(",");

export function isPropertyUploadMime(type: string): type is PropertyUploadMime {
  const normalized = type.toLowerCase();
  return (
    (IMAGE_UPLOAD_MIME as readonly string[]).includes(normalized) ||
    (VIDEO_UPLOAD_MIME as readonly string[]).includes(normalized) ||
    (AUDIO_UPLOAD_MIME as readonly string[]).includes(normalized)
  );
}

export function isRecordingMime(type: string): boolean {
  return type.startsWith("video/") || type.startsWith("audio/");
}

/** Resolve MIME from file.type or extension (phones often omit type on recordings). */
export function resolvePropertyUploadMime(file: File): PropertyUploadMime | null {
  const type = file.type?.toLowerCase().trim() ?? "";
  if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
  if (type === "image/x-png") return "image/png";
  if (type.startsWith("image/") && !isPropertyUploadMime(type)) {
    if (type.includes("jpeg") || type.includes("jpg")) return "image/jpeg";
    if (type.includes("png")) return "image/png";
    if (type.includes("webp")) return "image/webp";
    if (type.includes("gif")) return "image/gif";
    if (type.includes("heic") || type.includes("heif")) return "image/heic";
  }
  if (type && isPropertyUploadMime(type)) return type;

  if (type.startsWith("video/")) return "video/mp4";
  if (type.startsWith("audio/")) return "audio/mp4";

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? null;
}

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024;
export const MAX_RECORDING_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_BYTES;
