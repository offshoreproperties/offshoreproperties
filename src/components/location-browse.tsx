import { Link } from "@tanstack/react-router";
import { KENYA_BROWSE_LOCATIONS } from "@/lib/kenya-locations";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

type LocationBrowseProps = {
  variant?: "light" | "dark";
  className?: string;
  onSelect?: (location: string) => void;
};

export function LocationBrowse({ variant = "light", className, onSelect }: LocationBrowseProps) {
  const light = variant === "light";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <MapPin className={cn("h-4 w-4", light ? "text-blue-600" : "text-blue-400")} />
        <p className={cn("text-xs font-semibold uppercase tracking-wider", light ? "text-neutral-500" : "text-white/60")}>
          Browse by location
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {KENYA_BROWSE_LOCATIONS.map((area) => {
          const chip = (
            <span
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                light
                  ? "border-neutral-200 bg-white text-neutral-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10",
              )}
            >
              {area.label}
              <span className={cn("ml-1.5 text-xs", light ? "text-neutral-400" : "text-white/50")}>
                {area.city}
              </span>
            </span>
          );

          if (onSelect) {
            return (
              <button key={area.id} type="button" onClick={() => onSelect(area.label)} className="text-left">
                {chip}
              </button>
            );
          }

          return (
            <Link
              key={area.id}
              to="/properties"
              search={{ location: area.label }}
              className="inline-flex"
            >
              {chip}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
