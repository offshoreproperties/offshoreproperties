/** Browser-side image watermark — works on Cloudflare Workers where sharp cannot. */

/** Keep the mark small so object-cover cards do not crop or blow it up. */
const WATERMARK_SCALE = 0.11;
const WATERMARK_MAX_RATIO = 0.18;
const WATERMARK_PAD_RATIO = 0.028;
const JPEG_QUALITY = 0.92;

const LOGO_CANDIDATES = [
  "/watermark-mark.png",
  "/offshore-logo.png",
  "/Offshore%20Logo%20(1).png",
];

let logoImagePromise: Promise<HTMLImageElement> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error(`Logo loaded with empty size: ${src}`));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Could not load logo: ${src}`));
    img.src = src;
  });
}

async function loadLogoImage(): Promise<HTMLImageElement> {
  if (logoImagePromise) return logoImagePromise;

  logoImagePromise = (async () => {
    let lastError: unknown;
    for (const src of LOGO_CANDIDATES) {
      try {
        return await loadImage(src);
      } catch (err) {
        lastError = err;
      }
    }
    logoImagePromise = null;
    throw lastError instanceof Error
      ? lastError
      : new Error("Watermark logo could not be loaded");
  })();

  try {
    return await logoImagePromise;
  } catch (err) {
    logoImagePromise = null;
    throw err;
  }
}

function loadFileImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read photo for watermarking"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not encode watermarked photo"));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

function watermarkSize(photoW: number, photoH: number, logoW: number, logoH: number) {
  const shortSide = Math.min(photoW, photoH);
  let targetWidth = Math.round(shortSide * WATERMARK_SCALE);
  targetWidth = Math.min(targetWidth, Math.round(photoW * WATERMARK_MAX_RATIO));
  targetWidth = Math.max(48, targetWidth);

  const scale = targetWidth / Math.max(1, logoW);
  let targetHeight = Math.max(1, Math.round(logoH * scale));

  // Never let the mark cover more than ~18% of the frame height either.
  const maxH = Math.round(photoH * WATERMARK_MAX_RATIO);
  if (targetHeight > maxH) {
    const shrink = maxH / targetHeight;
    targetHeight = maxH;
    targetWidth = Math.max(40, Math.round(targetWidth * shrink));
  }

  const pad = Math.max(
    12,
    Math.min(36, Math.round(shortSide * WATERMARK_PAD_RATIO)),
  );
  const left = Math.min(pad, Math.max(0, photoW - targetWidth));
  const top = Math.min(pad, Math.max(0, photoH - targetHeight));
  return { targetWidth, targetHeight, left, top };
}

/** Stamp the Offshore logo in the top-left of a photo before upload. */
export async function watermarkImageFile(file: File): Promise<File> {
  if (typeof document === "undefined") {
    throw new Error("Watermarking is only available in the browser");
  }

  const [photo, logo] = await Promise.all([loadFileImage(file), loadLogoImage()]);

  const width = photo.naturalWidth || photo.width;
  const height = photo.naturalHeight || photo.height;
  if (!width || !height) {
    throw new Error("Photo has invalid dimensions");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable for watermarking");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo, 0, 0, width, height);

  const logoW = logo.naturalWidth || logo.width;
  const logoH = logo.naturalHeight || logo.height;
  const { targetWidth, targetHeight, left, top } = watermarkSize(width, height, logoW, logoH);
  ctx.drawImage(logo, left, top, targetWidth, targetHeight);

  // Always encode photos as JPEG so HEIC/PNG uploads still store a stamped image.
  const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  const baseName = file.name.replace(/\.[^.]+$/i, "") || "photo";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/** Warm the logo cache so the first upload is not delayed. */
export function preloadWatermarkLogo(): void {
  if (typeof window === "undefined") return;
  void loadLogoImage().catch(() => {
    /* first upload will surface the error */
  });
}
