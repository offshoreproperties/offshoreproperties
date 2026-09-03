import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, Expand, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { isVideoUrl, isAudioUrl } from "@/lib/media";

function MediaPreview({
  src,
  alt,
  className,
  loading,
  fetchPriority,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
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
        controls
        aria-label={alt}
      />
    );
  }
  if (isAudioUrl(src)) {
    return (
      <div
        className={cn(className, "flex flex-col items-center justify-center gap-4 bg-slate-950 p-6")}
        aria-label={alt}
      >
        <Mic className="h-10 w-10 text-white/80" />
        <audio src={src} controls className="w-full max-w-md" preload="metadata" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      {...(fetchPriority ? { fetchPriority } : {})}
    />
  );
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

/** Warm the browser cache for nearby slides so swipe feels instant. */
function usePreloadNeighbors(images: string[], active: number) {
  useEffect(() => {
    if (images.length <= 1) return;
    const idxs = new Set([
      active,
      (active + 1) % images.length,
      (active - 1 + images.length) % images.length,
    ]);
    for (const i of idxs) {
      const src = images[i];
      if (!src || isVideoUrl(src) || isAudioUrl(src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  }, [images, active]);
}

function useSyncedCarousel(
  imagesLength: number,
  active: number,
  setActive: (i: number) => void,
  startIndex = 0,
) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: imagesLength > 1,
    align: "start",
    containScroll: false,
    dragFree: false,
    skipSnaps: false,
    duration: 20,
    startIndex,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActive(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, setActive]);

  useEffect(() => {
    if (!emblaApi) return;
    if (emblaApi.selectedScrollSnap() !== active) {
      emblaApi.scrollTo(active);
    }
  }, [emblaApi, active]);

  const prev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);
  const next = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);
  const clickAllowed = useCallback(() => emblaApi?.clickAllowed() ?? true, [emblaApi]);

  return { emblaRef, prev, next, clickAllowed };
}

function GalleryLightbox({
  images,
  title,
  active,
  setActive,
  onClose,
}: {
  images: string[];
  title: string;
  active: number;
  setActive: (i: number) => void;
  onClose: () => void;
}) {
  const carousel = useSyncedCarousel(images.length, active, setActive, active);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (images.length <= 1) return;
      if (e.key === "ArrowLeft") carousel.prev();
      if (e.key === "ArrowRight") carousel.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, carousel, onClose]);

  return (
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
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close gallery"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="h-full w-full overflow-hidden" ref={carousel.emblaRef}>
          <div className="flex h-full touch-pan-y">
            {images.map((src, i) => (
              <div
                key={`lb-${src}-${i}`}
                className="flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-3 sm:px-14 md:px-20"
              >
                <MediaPreview
                  src={src}
                  alt={`${title} — photo ${i + 1}`}
                  className="pointer-events-none max-h-[calc(100vh-10rem)] max-h-[calc(100dvh-10rem)] max-w-full select-none object-contain"
                  loading={Math.abs(i - active) <= 1 ? "eager" : "lazy"}
                  fetchPriority={i === active ? "high" : "auto"}
                />
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <>
            <NavButton
              dir="prev"
              onClick={carousel.prev}
              large
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-4"
            />
            <NavButton
              dir="next"
              onClick={carousel.next}
              large
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:right-4"
            />
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-4xl justify-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] pb-1 [&::-webkit-scrollbar]:hidden">
            {images.map((src, i) => (
              <button
                key={`lb-thumb-${src}-${i}`}
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
  );
}

export function PropertyImageGallery({
  images,
  title,
  edgeToEdge = false,
}: {
  images: string[];
  title: string;
  edgeToEdge?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const setActiveSafe = useCallback((i: number) => setActive(i), []);
  const main = useSyncedCarousel(images.length, active, setActiveSafe);

  usePreloadNeighbors(images, active);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (images.length <= 1) return;
      if (e.key === "ArrowLeft") main.prev();
      if (e.key === "ArrowRight") main.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, lightboxOpen, main]);

  useEffect(() => {
    setActive(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className={cn(edgeToEdge ? "" : "bg-white")}>
        <div
          className={cn(
            "flex aspect-[4/3] w-full items-center justify-center bg-slate-100 text-sm text-slate-400",
            edgeToEdge
              ? "max-h-[min(56dvh,420px)] sm:mx-auto sm:max-h-[min(58dvh,520px)] sm:rounded-2xl"
              : "max-h-[min(52dvh,480px)] rounded-lg",
          )}
        >
          No photos available
        </div>
      </div>
    );
  }

  const frameClass = cn(
    "aspect-[4/3] w-full",
    edgeToEdge
      ? "max-h-[min(56dvh,420px)] sm:max-h-[min(58dvh,520px)]"
      : "max-h-[min(52dvh,52vh,480px)] sm:max-h-[min(58dvh,58vh,520px)]",
  );

  return (
    <>
      <div className={cn(edgeToEdge ? "" : "bg-white")}>
        <div className="w-full">
          <div
            className={cn(
              "relative w-full overflow-hidden bg-slate-100",
              edgeToEdge ? "sm:rounded-2xl" : "rounded-lg",
            )}
          >
            <div
              className={cn(frameClass, "cursor-grab active:cursor-grabbing")}
              ref={main.emblaRef}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button")) return;
                if (!main.clickAllowed()) return;
                setLightboxOpen(true);
              }}
            >
              <div className="flex h-full touch-pan-y">
                {images.map((src, i) => {
                  const near = Math.abs(i - active) <= 1;
                  return (
                    <div
                      key={`${src}-${i}`}
                      className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
                    >
                      <MediaPreview
                        src={src}
                        alt={`${title} — photo ${i + 1}`}
                        className="pointer-events-none h-full w-full select-none object-cover"
                        loading={near ? "eager" : "lazy"}
                        fetchPriority={i === active ? "high" : "auto"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute right-2 top-2 z-[2] flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur transition hover:bg-black/70 sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs"
              aria-label={`View ${title} photos full screen`}
            >
              <Expand className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Expand
            </button>

            {images.length > 1 && (
              <>
                <NavButton
                  dir="prev"
                  onClick={main.prev}
                  className="absolute left-2 top-1/2 z-[3] -translate-y-1/2"
                />
                <NavButton
                  dir="next"
                  onClick={main.next}
                  className="absolute right-2 top-1/2 z-[3] -translate-y-1/2"
                />
                <span className="pointer-events-none absolute bottom-2 right-2 z-[2] rounded-full bg-blue-600/90 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur sm:bottom-3 sm:right-3 sm:text-xs">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div
              className={cn(
                "mt-2 flex gap-1.5 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                edgeToEdge ? "sm:px-0" : "",
              )}
            >
              {images.map((src, i) => (
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
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <GalleryLightbox
          images={images}
          title={title}
          active={active}
          setActive={setActiveSafe}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
