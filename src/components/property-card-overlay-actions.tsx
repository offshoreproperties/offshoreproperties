import { Heart, Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useVisitorEngagement } from "@/hooks/use-visitor-engagement";
import { SITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type PropertyCardOverlayActionsProps = {
  propertyId: string;
  slug: string | null;
  title: string;
  className?: string;
};

function OverlayBtn({
  active,
  label,
  onClick,
  disabled,
  children,
  activeClass,
}: {
  active?: boolean;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-60",
        active && activeClass,
      )}
    >
      {children}
    </button>
  );
}

export function PropertyCardOverlayActions({
  propertyId,
  slug,
  title,
  className,
}: PropertyCardOverlayActionsProps) {
  const { liked, saved, toggleLike, toggleSave, likePending, savePending } =
    useVisitorEngagement(propertyId);
  const [shareOk, setShareOk] = useState(false);
  const shareUrl = `${SITE_URL}/properties/${slug ?? propertyId}`;

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Check out ${title} on Offshore Properties`, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareOk(true);
      toast.success("Link copied");
      window.setTimeout(() => setShareOk(false), 2000);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share");
    }
  }

  return (
    <div
      className={cn("absolute right-2 top-2 z-20 flex flex-col gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <OverlayBtn
        label={liked ? "Unlike" : "Like"}
        active={liked}
        activeClass="text-red-500"
        disabled={likePending}
        onClick={toggleLike}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      </OverlayBtn>
      <OverlayBtn
        label={saved ? "Remove from shortlist" : "Save to shortlist"}
        active={saved}
        activeClass="text-blue-600"
        disabled={savePending}
        onClick={toggleSave}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      </OverlayBtn>
      <OverlayBtn label="Share" onClick={handleShare}>
        <Share2 className={cn("h-4 w-4", shareOk && "text-emerald-600")} />
      </OverlayBtn>
    </div>
  );
}
