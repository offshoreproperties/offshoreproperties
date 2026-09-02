const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

export const PROPERTY_MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

export const IMAGE_UPLOAD_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const VIDEO_UPLOAD_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type PropertyUploadMime = (typeof IMAGE_UPLOAD_MIME)[number] | (typeof VIDEO_UPLOAD_MIME)[number];

export function isPropertyUploadMime(type: string): type is PropertyUploadMime {
  return (
    (IMAGE_UPLOAD_MIME as readonly string[]).includes(type) ||
    (VIDEO_UPLOAD_MIME as readonly string[]).includes(type)
  );
}

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024;
