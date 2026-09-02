import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { recordSiteVisit } from "@/lib/analytics.functions";

export function SiteVisitTracker() {
  const { pathname } = useLocation();
  const track = useServerFn(recordSiteVisit);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    void track({
      data: {
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      },
    }).catch(() => {
      // Non-blocking analytics — ignore rate limits / network errors
    });
  }, [pathname, track]);

  return null;
}
