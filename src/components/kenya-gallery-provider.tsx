import { createContext, useContext, useEffect, useState } from "react";
import { KENYA_GALLERY_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    KENYA_GALLERY_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const tick = KENYA_GALLERY_HOLD_MS + KENYA_GALLERY_FADE_MS;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % KENYA_GALLERY_IMAGES.length);
    }, tick);
    return () => window.clearInterval(id);
  }, []);

  return (
    <KenyaGalleryContext.Provider value={{ index }}>{children}</KenyaGalleryContext.Provider>
  );
}

/** Kenyan image roll — only rendered inside the homepage hero card. */
export function HeroKenyaGallery({ className }: { className?: string }) {
  const { index } = useContext(KenyaGalleryContext);

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-sky-50", className)}>
      {KENYA_GALLERY_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          fetchPriority={i === index ? "high" : "low"}
          className={cn(
            "absolute inset-0 h-full w-full object-cover brightness-[1.08] saturate-[1.12] transition-opacity ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
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
