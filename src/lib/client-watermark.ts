/** Browser-side image watermark — works on Cloudflare Workers where sharp cannot. */

const WATERMARK_SCALE = 0.22;
const WATERMARK_PADDING = 20;
const JPEG_QUALITY = 0.9;

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

  ctx.drawImage(photo, 0, 0, width, height);

  const targetWidth = Math.max(64, Math.round(Math.min(width, height) * WATERMARK_SCALE));
  const scale = targetWidth / Math.max(1, logo.naturalWidth || logo.width);
  const targetHeight = Math.max(1, Math.round((logo.naturalHeight || logo.height) * scale));
  const left = Math.min(WATERMARK_PADDING, Math.max(0, width - targetWidth));
  const top = Math.min(WATERMARK_PADDING, Math.max(0, height - targetHeight));
  ctx.drawImage(logo, left, top, targetWidth, targetHeight);

  const inputType = (file.type || "image/jpeg").toLowerCase();
  const outputType =
    inputType === "image/png"
      ? "image/png"
      : inputType === "image/webp"
        ? "image/webp"
        : "image/jpeg";

  const blob = await canvasToBlob(
    canvas,
    outputType,
    outputType === "image/jpeg" || outputType === "image/webp" ? JPEG_QUALITY : undefined,
  );

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "photo";
  const ext = outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${baseName}.${ext}`, {
    type: outputType,
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
