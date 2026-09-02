import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getKenyaGallerySlides,
  getKenyaGallerySrc,
  isKenyaGalleryPath,
  kenyaGalleryCacheBust,
} from "@/lib/kenya-gallery";
import { cn } from "@/lib/utils";

/** Full visibility per slide before the next transition */
export const KENYA_GALLERY_HOLD_MS = 5000;
/** Crossfade — one image fully replaces the previous */
export const KENYA_GALLERY_FADE_MS = 2200;

type KenyaGalleryContextValue = {
  index: number;
  slides: readonly string[];
  broken: Set<string>;
  markBroken: (src: string) => void;
};

const KenyaGalleryContext = createContext<KenyaGalleryContextValue>({
  index: 0,
  slides: [],
  broken: new Set(),
  markBroken: () => {},
});

/** Keeps the hero gallery timer alive across page navigation. */
export function KenyaGalleryProvider({ children }: { children: React.ReactNode }) {
  const slides = useMemo(
    () => getKenyaGallerySlides().map(kenyaGalleryCacheBust),
    [],
  );

  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Set<string>>(() => new Set());

  const visible = useMemo(
    () => slides.filter((src) => !broken.has(src) && isKenyaGalleryPath(getKenyaGallerySrc(src))),
    [slides, broken],
  );

  const slideCount = visible.length;

  const nextIndex = useCallback(
    (from: number) => (slideCount ? (from + 1) % slideCount : 0),
    [slideCount],
  );

  const markBroken = useCallback((src: string) => {
    setBroken((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  /** Preload every slide at full resolution up front (avoids soft progressive loads). */
  useEffect(() => {
    visible.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [visible]);

  useEffect(() => {
    if (!slideCount) return;
    const preload = new Image();
    preload.src = visible[nextIndex(index)];
  }, [visible, index, slideCount, nextIndex]);

  useEffect(() => {
    if (!slideCount) return;
    const tick = KENYA_GALLERY_HOLD_MS + KENYA_GALLERY_FADE_MS;
    const id = window.setInterval(() => {
      setIndex((i) => nextIndex(i));
    }, tick);
    return () => window.clearInterval(id);
  }, [slideCount, nextIndex]);

  useEffect(() => {
    if (!slideCount) return;
    const current = visible[index % slideCount];
    if (current && broken.has(current)) {
      setIndex((i) => nextIndex(i));
    }
  }, [broken, index, slideCount, visible, nextIndex]);

  useEffect(() => {
    setIndex(0);
  }, [slideCount]);

  return (
    <KenyaGalleryContext.Provider value={{ index, slides: visible, broken, markBroken }}>
      {children}
    </KenyaGalleryContext.Provider>
  );
}

/** Kenyan image roll — fixed order from kenya-gallery.allowlist.json (public/kenya only). */
export function HeroKenyaGallery({ className }: { className?: string }) {
  const { index, slides, markBroken } = useContext(KenyaGalleryContext);

  if (!slides.length) {
    return <div aria-hidden className={cn("absolute inset-0 bg-slate-800", className)} />;
  }

  const activeIndex = index % slides.length;

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-neutral-900", className)}>
      {slides.map((src, i) => {
        const isActive = i === activeIndex;
        return (
          <img
            key={src}
            src={src}
            alt=""
            sizes="100vw"
            loading={i === 0 ? "eager" : "lazy"}
            decoding={isActive ? "sync" : "async"}
            fetchPriority={isActive ? "high" : "low"}
            onError={() => markBroken(src)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-center transition-opacity ease-in-out",
              "brightness-[1.08] saturate-[1.12] contrast-[1.03]",
              "transform-gpu will-change-[opacity] [backface-visibility:hidden]",
              isActive ? "opacity-100" : "opacity-0",
            )}
            style={{
              transitionDuration: `${KENYA_GALLERY_FADE_MS}ms`,
              transitionTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
              zIndex: isActive ? 2 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
