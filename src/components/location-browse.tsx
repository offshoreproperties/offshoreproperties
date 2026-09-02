import { Link } from "@tanstack/react-router";
import { KENYA_BROWSE_LOCATIONS } from "@/lib/kenya-locations";
import { cn } from "@/lib/utils";

type LocationBrowseProps = {
  variant?: "light" | "dark";
  compact?: boolean;
  className?: string;
  onSelect?: (location: string) => void;
};

export function LocationBrowse({
  variant = "light",
  compact = false,
  className,
  onSelect,
}: LocationBrowseProps) {
  const light = variant === "light";

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3", className)}>
      {!compact ? (
        <div>
          <p
            className={cn(
              "text-base font-semibold",
              light ? "text-slate-900" : "text-white",
            )}
          >
            Where do you want to live?
          </p>
          <p className={cn("mt-1 text-sm", light ? "text-slate-500" : "text-white/60")}>
            Tap an area — we&apos;ll show you what&apos;s listed there.
          </p>
        </div>
      ) : null}

      <div className={cn("scrollbar-hide scroll-fade-x -mx-1 flex gap-1.5 overflow-x-auto pb-0.5 pt-0.5", compact && "gap-1.5")}>
        {KENYA_BROWSE_LOCATIONS.map((area) => {
          const chip = (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full font-medium shadow-sm transition",
                compact ? "min-h-10 px-3 py-2 text-xs" : "min-h-11 px-4 py-2.5 text-sm",
                light
                  ? "border border-slate-200/80 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
                  : "border border-white/15 bg-white/10 text-white hover:bg-white/15",
              )}
            >
              {area.label}
              <span className={cn("text-xs font-normal", light ? "text-slate-400" : "text-white/50")}>
                {area.city}
              </span>
            </span>
          );

          if (onSelect) {
            return (
              <button key={area.id} type="button" onClick={() => onSelect(area.label)} className="shrink-0">
                {chip}
              </button>
            );
          }

          return (
            <Link
              key={area.id}
              to="/properties"
              search={{ location: area.label }}
              className="shrink-0"
            >
              {chip}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
