import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toggleLike, toggleSave, getMyEngagement, getPropertyEngagement } from "@/lib/social.functions";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PropertyActions({ propertyId }: { propertyId: string }) {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const fetchEngagement = useServerFn(getPropertyEngagement);
  const fetchMine = useServerFn(getMyEngagement);
  const likeFn = useServerFn(toggleLike);
  const saveFn = useServerFn(toggleSave);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const { data: counts } = useQuery({
    queryKey: ["engagement", propertyId],
    queryFn: () => fetchEngagement({ data: { propertyId } }),
  });

  const { data: mine } = useQuery({
    queryKey: ["my-engagement", propertyId, user?.id],
    queryFn: () => fetchMine({ data: { propertyId } }),
    enabled: !!user,
  });

  const likeMut = useMutation({
    mutationFn: () => likeFn({ data: { propertyId } }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["my-engagement", propertyId] });
      await qc.cancelQueries({ queryKey: ["engagement", propertyId] });
      const prevMine = qc.getQueryData(["my-engagement", propertyId, user?.id]);
      const prevCounts = qc.getQueryData(["engagement", propertyId]);
      const wasLiked = (prevMine as { liked?: boolean } | undefined)?.liked ?? false;
      qc.setQueryData(["my-engagement", propertyId, user?.id], (old: unknown) => ({
        ...(old as object),
        liked: !wasLiked,
      }));
      qc.setQueryData(["engagement", propertyId], (old: unknown) => ({
        ...(old as object),
        likeCount: ((old as { likeCount?: number } | undefined)?.likeCount ?? 0) + (wasLiked ? -1 : 1),
      }));
      return { prevMine, prevCounts };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevMine) qc.setQueryData(["my-engagement", propertyId, user?.id], context.prevMine);
      if (context?.prevCounts) qc.setQueryData(["engagement", propertyId], context.prevCounts);
      toast.error("Could not update like");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["engagement", propertyId] });
      qc.invalidateQueries({ queryKey: ["my-engagement", propertyId] });
    },
  });

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { propertyId } }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["my-engagement", propertyId] });
      const prevMine = qc.getQueryData(["my-engagement", propertyId, user?.id]);
      const wasSaved = (prevMine as { saved?: boolean } | undefined)?.saved ?? false;
      qc.setQueryData(["my-engagement", propertyId, user?.id], (old: unknown) => ({
        ...(old as object),
        saved: !wasSaved,
      }));
      return { prevMine };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevMine) qc.setQueryData(["my-engagement", propertyId, user?.id], context.prevMine);
      toast.error("Could not update save");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["engagement", propertyId] });
      qc.invalidateQueries({ queryKey: ["my-engagement", propertyId] });
      qc.invalidateQueries({ queryKey: ["saved-properties"] });
    },
  });

  function requireAuth(action: () => void) {
    if (!user) {
      setAuthMode("signup");
      setAuthOpen(true);
      return;
    }
    action();
  }

  const likeCount = counts?.likeCount ?? 0;

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition active:scale-95 sm:min-h-9 sm:px-3 sm:text-xs",
            mine?.liked
              ? "bg-red-50 text-red-600"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
          )}
          disabled={authLoading || likeMut.isPending}
          onClick={() => requireAuth(() => likeMut.mutate())}
        >
          <Heart className={cn("h-3.5 w-3.5", mine?.liked && "fill-current")} />
          {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition active:scale-95 sm:min-h-9 sm:px-3 sm:text-xs",
            mine?.saved
              ? "bg-blue-50 text-blue-600"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
          )}
          disabled={authLoading || saveMut.isPending}
          onClick={() => requireAuth(() => saveMut.mutate())}
        >
          <Bookmark className={cn("h-3.5 w-3.5", mine?.saved && "fill-current")} />
          Save
        </button>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </>
  );
}
