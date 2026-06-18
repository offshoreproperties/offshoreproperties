import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  KENYA_GALLERY_FADE_MS,
  KENYA_GALLERY_HOLD_MS,
} from "@/components/kenya-gallery-provider";

type FadePhrasesProps = {
  phrases: string[];
  holdMs?: number;
  fadeMs?: number;
  className?: string;
};

/** Crossfades phrases — same timing/easing as the hero image gallery. */
export function FadePhrases({
  phrases,
  holdMs = KENYA_GALLERY_HOLD_MS,
  fadeMs = KENYA_GALLERY_FADE_MS,
  className,
}: FadePhrasesProps) {
  const [index, setIndex] = useState(0);
  const longest = phrases.reduce((a, b) => (a.length >= b.length ? a : b), phrases[0] ?? "");

  useEffect(() => {
    setIndex(0);
  }, [phrases]);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const tick = holdMs + fadeMs;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, tick);
    return () => window.clearInterval(id);
  }, [phrases, holdMs, fadeMs]);

  if (phrases.length === 0) return null;

  return (
    <span className={cn("relative block w-full", className)}>
      {/* Reserve height so layout never jumps */}
      <span className="invisible block select-none" aria-hidden>
        {longest}
      </span>

      {phrases.map((phrase, i) => (
        <span
          key={phrase}
          aria-hidden={i !== index}
          className="absolute left-0 top-0 w-full transition-opacity ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            transitionDuration: `${fadeMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
            zIndex: i === index ? 2 : 1,
          }}
        >
          {phrase}
        </span>
      ))}
    </span>
  );
}

/** Single-line fade rotator for placeholders (e.g. AI search). */
export function FadeRotator({
  items,
  holdMs = KENYA_GALLERY_HOLD_MS,
  fadeMs = KENYA_GALLERY_FADE_MS,
  className,
}: {
  items: string[];
  holdMs?: number;
  fadeMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const tick = holdMs + fadeMs;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, tick);
    return () => window.clearInterval(id);
  }, [items, holdMs, fadeMs]);

  if (items.length === 0) return null;

  return (
    <span className={cn("relative block w-full truncate", className)}>
      {items.map((item, i) => (
        <span
          key={item}
          aria-hidden={i !== index}
          className="absolute inset-0 truncate transition-opacity ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            transitionDuration: `${fadeMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
            zIndex: i === index ? 2 : 1,
          }}
        >
          {item}
        </span>
      ))}
      <span className="invisible truncate" aria-hidden>
        {items.reduce((a, b) => (a.length >= b.length ? a : b), items[0] ?? "")}
      </span>
    </span>
  );
}
