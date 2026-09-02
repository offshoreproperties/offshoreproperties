import { Heart, Bookmark } from "lucide-react";
import { useVisitorEngagement } from "@/hooks/use-visitor-engagement";
import { cn } from "@/lib/utils";

export function PropertyActions({
  propertyId,
  compact = false,
}: {
  propertyId: string;
  compact?: boolean;
}) {
  const { liked, saved, likeCount, toggleLike, toggleSave, likePending, savePending } =
    useVisitorEngagement(propertyId);

  const btnBase = compact
    ? "inline-flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95"
    : "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition active:scale-95 sm:min-h-9 sm:px-3 sm:text-xs";

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className={cn(
          btnBase,
          liked
            ? "bg-red-50 text-red-600"
            : compact
              ? "bg-white text-neutral-600 ring-1 ring-slate-200 hover:bg-neutral-50"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
        )}
        disabled={likePending}
        onClick={toggleLike}
        title={compact ? (likeCount > 0 ? `${likeCount} likes` : "Like") : undefined}
        aria-label="Like property"
      >
        <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
        {!compact ? (likeCount > 0 ? likeCount : "Like") : null}
      </button>
      <button
        type="button"
        className={cn(
          btnBase,
          saved
            ? "bg-blue-50 text-blue-600"
            : compact
              ? "bg-white text-neutral-600 ring-1 ring-slate-200 hover:bg-neutral-50"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
        )}
        disabled={savePending}
        onClick={toggleSave}
        title={compact ? "Save property" : undefined}
        aria-label="Save property"
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        {!compact ? "Save" : null}
      </button>
    </div>
  );
}
