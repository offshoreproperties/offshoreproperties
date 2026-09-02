import { Check } from "lucide-react";
import {
  LISTING_BADGE_OPTIONS,
  MAX_LISTING_BADGES,
  type ListingBadgeId,
} from "@/lib/listing-badges";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ListingBadgePicker({
  value,
  onChange,
  isFeatured,
  onFeaturedChange,
}: {
  value: ListingBadgeId[];
  onChange: (next: ListingBadgeId[]) => void;
  isFeatured: boolean;
  onFeaturedChange: (next: boolean) => void;
}) {
  const selected = new Set(value);

  function toggle(id: ListingBadgeId) {
    if (selected.has(id)) {
      onChange(value.filter((b) => b !== id));
      return;
    }
    if (value.length >= MAX_LISTING_BADGES) return;
    onChange([...value, id]);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <Label className="text-base">Listing badges</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Highlight this property on cards and the detail page. Choose up to {MAX_LISTING_BADGES}{" "}
          marketing badges.
        </p>
      </div>

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
          isFeatured
            ? "border-amber-400/60 bg-amber-400/10"
            : "border-border bg-background hover:bg-muted/30",
        )}
      >
        <input
          type="checkbox"
          className="mt-1"
          checked={isFeatured}
          onChange={(e) => onFeaturedChange(e.target.checked)}
        />
        <span>
          <span className="font-medium text-foreground">Featured listing</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Star badge + priority placement on homepage and search results.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {LISTING_BADGE_OPTIONS.map((badge) => {
          const active = selected.has(badge.id);
          const disabled = !active && value.length >= MAX_LISTING_BADGES;
          return (
            <button
              key={badge.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(badge.id)}
              className={cn(
                "flex min-h-[72px] flex-col items-start gap-2 rounded-xl border p-3 text-left transition",
                active
                  ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                  : "border-border bg-background hover:border-neutral-300 hover:bg-muted/30",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
                {active && <Check className="h-4 w-4 text-blue-600" aria-hidden />}
              </div>
              <span className="text-xs leading-snug text-muted-foreground">{badge.description}</span>
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selected: {value.map((id) => LISTING_BADGE_OPTIONS.find((b) => b.id === id)?.label).join(", ")}
        </p>
      )}
    </div>
  );
}
