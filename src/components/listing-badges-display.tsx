import { Star } from "lucide-react";
import {
  listingBadgeClassName,
  listingBadgeLabel,
  normalizeListingBadges,
} from "@/lib/listing-badges";
import { cn } from "@/lib/utils";

export function ListingBadgesDisplay({
  badges,
  isFeatured,
  className,
  limit,
  size = "sm",
}: {
  badges?: string[] | null;
  isFeatured?: boolean | null;
  className?: string;
  limit?: number;
  size?: "sm" | "md";
}) {
  const normalized = normalizeListingBadges(badges);
  const items = limit ? normalized.slice(0, limit) : normalized;
  const extra = limit && normalized.length > limit ? normalized.length - limit : 0;

  if (!isFeatured && items.length === 0 && extra === 0) return null;

  const text = size === "md" ? "text-xs sm:text-sm" : "text-[10px] sm:text-[11px]";
  const pad = size === "md" ? "px-2.5 py-1" : "px-1.5 py-0.5";

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {isFeatured && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-neutral-900 font-semibold uppercase tracking-wide text-white",
            text,
            pad,
          )}
        >
          <Star className="h-3 w-3 fill-current" aria-hidden />
          Featured
        </span>
      )}
      {items.map((id) => (
        <span
          key={id}
          className={cn(
            "rounded-md font-semibold uppercase tracking-wide",
            text,
            pad,
            listingBadgeClassName(id),
          )}
        >
          {listingBadgeLabel(id)}
        </span>
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "rounded-md bg-neutral-100 font-semibold uppercase tracking-wide text-neutral-600",
            text,
            pad,
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
