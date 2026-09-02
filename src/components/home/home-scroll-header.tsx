import { useEffect, useRef, useState } from "react";
import { PublicHeader, type HomeTab } from "@/components/public-header";
import { cn } from "@/lib/utils";

type HomeScrollHeaderProps = {
  homeTab: HomeTab;
  onHomeTabChange: (tab: HomeTab) => void;
};

/** Sticky bar header that slides in once the homepage hero scrolls out of view. */
export function HomeScrollHeader({ homeTab, onHomeTabChange }: HomeScrollHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-[transform,opacity] duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
        )}
        aria-hidden={!visible}
      >
        <PublicHeader variant="bar" homeTab={homeTab} onHomeTabChange={onHomeTabChange} compact />
      </div>
    </>
  );
}
