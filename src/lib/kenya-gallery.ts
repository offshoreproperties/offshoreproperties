import { KENYA_GALLERY_IMAGES, KENYA_GALLERY_CACHE_KEY } from "@/lib/kenya-gallery.generated";

const KENYA_PATH = /^\/kenya\/[^/\\?#]+$/;

/** True when URL is a bare public/kenya asset (no external or root-level paths). */
export function isKenyaGalleryPath(src: string): boolean {
  const path = src.split("?")[0]?.split("#")[0] ?? "";
  return KENYA_PATH.test(path);
}

/** Slideshow paths — allowlist + generated sync only; strips anything else. */
export function getKenyaGallerySlides(): readonly string[] {
  return KENYA_GALLERY_IMAGES.filter(isKenyaGalleryPath);
}

function allowlistVersion(): string {
  let h = 0;
  for (let i = 0; i < KENYA_GALLERY_CACHE_KEY.length; i++) {
    h = (Math.imul(31, h) + KENYA_GALLERY_CACHE_KEY.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

const GALLERY_VERSION = allowlistVersion();

/** Cache-bust when allowlist changes — does not alter image bytes. */
export function kenyaGalleryCacheBust(src: string): string {
  const path = src.split("?")[0] ?? src;
  return `${path}?v=${GALLERY_VERSION}`;
}

/** Plain paths for preload / full-resolution fetch (no query string). */
export function getKenyaGallerySrc(path: string): string {
  return path.split("?")[0] ?? path;
}
