import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportVisitorEngagementForSync } from "@/lib/visitor-engagement-store";
import { syncVisitorEngagement } from "@/lib/social.functions";

/** Background sync of browser-cached likes/saves to the database. */
export function VisitorEngagementSync() {
  const syncFn = useServerFn(syncVisitorEngagement);
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    const payload = exportVisitorEngagementForSync();
    if (!payload.likes.length && !payload.saves.length) return;
    syncFn({ data: payload }).catch(() => {});
  }, [syncFn]);

  return null;
}
