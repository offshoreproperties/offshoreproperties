import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/media";

function MediaPreview({
  src,
  alt,
  className,
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        playsInline
        loop
        preload="metadata"
        aria-label={alt}
      />
    );
  }
  return <img src={src} alt={alt} className={className} loading={loading} />;
}

export function collectPropertyImages(
  hero: string | null | undefined,
  images: string[] | null | undefined,
): string[] {
  const out: string[] = [];
  const add = (url: string | null | undefined) => {
    if (!url) return;
    const parts = url.includes(",") ? url.split(",").map((s) => s.trim()) : [url];
    for (const u of parts) {
      if (u && !out.includes(u)) out.push(u);
    }
  };
  add(hero);
  for (const u of images ?? []) add(u);
  return out;
}

function NavButton({
  dir,
  onClick,
  className,
  large,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  className?: string;
  large?: boolean;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg transition hover:bg-white active:scale-95",
        large ? "h-12 w-12 sm:h-14 sm:w-14" : "h-10 w-10 sm:h-11 sm:w-11",
        className,
      )}
      aria-label={dir === "prev" ? "Previous photo" : "Next photo"}
    >
      <Icon className={large ? "h-7 w-7" : "h-5 w-5"} />
    </button>
  );
}

export function PropertyImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = useCallback(() => {
    setActive((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % images.length);
  }, [images.length]);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (images.length <= 1) return;
      if (lightboxOpen) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
        return;
      }
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, lightboxOpen, prev, next, closeLightbox]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  if (images.length === 0) {
    return (
      <div className="bg-white">
        <div className="flex aspect-[4/3] w-full max-h-[min(52dvh,52vh,480px)] items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400">
          No photos available
        </div>
      </div>
    );
  }

  const thumbBtn = (src: string, i: number) => (
    <button
      key={`${src}-${i}`}
      type="button"
      onClick={() => setActive(i)}
      className={cn(
        "relative h-14 w-[72px] shrink-0 overflow-hidden rounded-md ring-2 transition sm:h-16 sm:w-20",
        i === active ? "ring-blue-600" : "ring-transparent opacity-75 hover:opacity-100",
      )}
    >
      <MediaPreview src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
    </button>
  );

  return (
    <>
      <div className="bg-white">
        <div className="w-full">
          {/* Main image — full column width, click to expand */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative w-full overflow-hidden rounded-lg bg-neutral-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`View ${title} photos full screen`}
          >
            <div className="aspect-[4/3] w-full max-h-[min(52dvh,52vh,480px)] sm:max-h-[min(58dvh,58vh,520px)]">
              <MediaPreview
                key={images[active]}
                src={images[active]}
                alt={`${title} — photo ${active + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
              />
            </div>

            <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
              <Expand className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Expand
            </span>

            {images.length > 1 && (
              <>
                <NavButton
                  dir="prev"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                />
                <NavButton
                  dir="next"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-blue-600/90 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur sm:bottom-3 sm:right-3 sm:text-xs">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </button>

          {images.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((src, i) => thumbBtn(src, i))}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo gallery`}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
            <p className="truncate text-sm font-medium text-white/90 sm:text-base">
              {title}
              <span className="ml-2 text-white/50">
                {active + 1} / {images.length}
              </span>
            </p>
            <button
              type="button"
              onClick={closeLightbox}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 sm:px-20">
            <MediaPreview
              key={images[active]}
              src={images[active]}
              alt={`${title} — photo ${active + 1}`}
              className="max-h-[calc(100vh-10rem)] max-h-[calc(100dvh-10rem)] max-w-full object-contain"
            />
            {images.length > 1 && (
              <>
                <NavButton
                  dir="prev"
                  onClick={prev}
                  large
                  className="absolute left-2 top-1/2 -translate-y-1/2 sm:left-4"
                />
                <NavButton
                  dir="next"
                  onClick={next}
                  large
                  className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-4"
                />
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-4xl justify-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] pb-1 [&::-webkit-scrollbar]:hidden">
                {images.map((src, i) => (
                  <button
                    key={`lb-${src}-${i}`}
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-16 sm:w-24",
                      i === active ? "ring-blue-500" : "ring-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <MediaPreview src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
