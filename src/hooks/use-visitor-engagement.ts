import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrCreateVisitorId } from "@/lib/visitor-id";
import {
  getVisitorEngagementState,
  isPropertyLiked,
  isPropertySaved,
  subscribeVisitorEngagement,
  toggleVisitorLike,
  toggleVisitorSave,
} from "@/lib/visitor-engagement-store";
import {
  getPropertyEngagement,
  toggleGuestLike,
  toggleGuestSave,
} from "@/lib/social.functions";

export function useVisitorEngagement(propertyId: string) {
  const qc = useQueryClient();
  const fetchCounts = useServerFn(getPropertyEngagement);
  const guestLikeFn = useServerFn(toggleGuestLike);
  const guestSaveFn = useServerFn(toggleGuestSave);

  const [, bump] = useState(0);
  useEffect(() => subscribeVisitorEngagement(() => bump((n) => n + 1)), []);

  const liked = isPropertyLiked(propertyId);
  const saved = isPropertySaved(propertyId);

  const { data: counts } = useQuery({
    queryKey: ["engagement", propertyId],
    queryFn: () => fetchCounts({ data: { propertyId } }),
    staleTime: 60_000,
  });

  const likeMut = useMutation({
    mutationFn: async () => {
      const visitorId = getOrCreateVisitorId();
      const nowLiked = toggleVisitorLike(propertyId);
      await guestLikeFn({ data: { visitorId, propertyId, liked: nowLiked } });
      return nowLiked;
    },
    onMutate: () => {
      const wasLiked = isPropertyLiked(propertyId);
      qc.setQueryData(["engagement", propertyId], (old: { likeCount?: number; saveCount?: number } | undefined) => ({
        likeCount: Math.max(0, (old?.likeCount ?? 0) + (wasLiked ? -1 : 1)),
        saveCount: old?.saveCount ?? 0,
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["engagement", propertyId] }),
    onError: () => toast.error("Could not update like"),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const visitorId = getOrCreateVisitorId();
      const nowSaved = toggleVisitorSave(propertyId);
      await guestSaveFn({ data: { visitorId, propertyId, saved: nowSaved } });
      return nowSaved;
    },
    onSuccess: (nowSaved) => {
      toast.success(nowSaved ? "Saved to your shortlist" : "Removed from shortlist");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["saved-properties-local"] });
    },
    onError: () => toast.error("Could not update save"),
  });

  const toggleLike = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      likeMut.mutate();
    },
    [likeMut],
  );

  const toggleSave = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      saveMut.mutate();
    },
    [saveMut],
  );

  return {
    liked,
    saved,
    likeCount: counts?.likeCount ?? 0,
    saveCount: counts?.saveCount ?? 0,
    toggleLike,
    toggleSave,
    likePending: likeMut.isPending,
    savePending: saveMut.isPending,
    visitorId: getVisitorEngagementState().visitorId,
  };
}
