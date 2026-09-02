import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { KENYA_GALLERY_IMAGES, KENYA_GALLERY_CACHE_KEY } from "@/lib/kenya-gallery.generated";
import { cn } from "@/lib/utils";

/** Bust browser cache when allowlist changes */

/** Full visibility per slide before the next dissolve begins */
export const KENYA_GALLERY_HOLD_MS = 4000;
/** Crossfade duration — outgoing fades out while incoming fades in */
export const KENYA_GALLERY_FADE_MS = 2800;

type KenyaGalleryContextValue = {
  index: number;
};

const KenyaGalleryContext = createContext<KenyaGalleryContextValue>({ index: 0 });

/** Keeps the hero gallery timer alive across page navigation. */
export function KenyaGalleryProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () =>
      KENYA_GALLERY_IMAGES.map(
        (src) => `${src}?v=${encodeURIComponent(KENYA_GALLERY_CACHE_KEY.slice(0, 48))}`,
      ),
    [],
  );

  useEffect(() => {
    if (!slides.length) return;
    const preload = new Image();
    preload.src = slides[index % slides.length];
  }, [slides, index]);

  useEffect(() => {
    if (!slides.length) return;
    const tick = KENYA_GALLERY_HOLD_MS + KENYA_GALLERY_FADE_MS;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, tick);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <KenyaGalleryContext.Provider value={{ index }}>{children}</KenyaGalleryContext.Provider>
  );
}

/** Kenyan image roll — only rendered inside the homepage hero card. */
export function HeroKenyaGallery({ className }: { className?: string }) {
  const { index } = useContext(KenyaGalleryContext);

  const slides = useMemo(
    () =>
      KENYA_GALLERY_IMAGES.map(
        (src) => `${src}?v=${encodeURIComponent(KENYA_GALLERY_CACHE_KEY.slice(0, 48))}`,
      ),
    [],
  );

  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const visible = slides.filter((src) => !broken.has(src));

  if (!visible.length) {
    return <div aria-hidden className={cn("absolute inset-0 bg-slate-800", className)} />;
  }

  const activeIndex = index % visible.length;

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-slate-900", className)}>
      {visible.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          fetchPriority={i === activeIndex ? "high" : "low"}
          onError={() => setBroken((prev) => new Set(prev).add(src))}
          className={cn(
            "absolute inset-0 h-full w-full min-h-full min-w-full object-cover object-[center_62%] transition-opacity ease-in-out sm:object-[center_58%]",
            i === activeIndex ? "opacity-100" : "opacity-0",
          )}
          style={{
            transitionDuration: `${KENYA_GALLERY_FADE_MS}ms`,
            transitionTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
          }}
        />
      ))}
    </div>
  );
}
