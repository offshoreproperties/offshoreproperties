import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { PropertyCard } from "@/components/property-card";
import { listProperties } from "@/lib/properties.functions";
import { getSavedPropertyIds, subscribeVisitorEngagement, exportVisitorEngagementForSync } from "@/lib/visitor-engagement-store";
import { syncVisitorEngagement } from "@/lib/social.functions";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: `Saved — ${BRAND.name}` }] }),
  component: SavedPage,
});

function SavedPage() {
  const fetch = useServerFn(listProperties);
  const syncFn = useServerFn(syncVisitorEngagement);
  const [, bump] = useState(0);

  useEffect(() => subscribeVisitorEngagement(() => bump((n) => n + 1)), []);

  useEffect(() => {
    const payload = exportVisitorEngagementForSync();
    if (payload.saves.length) syncFn({ data: payload }).catch(() => {});
  }, [syncFn]);

  const savedIds = getSavedPropertyIds();

  const { data, isLoading } = useQuery({
    queryKey: ["saved-properties-local", savedIds.join(",")],
    queryFn: () => fetch({ data: { slugs: savedIds, limit: 50 } }),
    enabled: savedIds.length > 0,
  });

  const properties = data?.rows ?? [];

  return (
    <SiteLayout>
      <section className="page-panel">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Your shortlist</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Saved on this device — kept in your browser and synced in the background. No sign-in needed.
        </p>

        {isLoading && savedIds.length > 0 && (
          <div className="mt-8 h-48 animate-pulse rounded-xl bg-neutral-100" />
        )}

        {!isLoading && savedIds.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-center text-neutral-600 sm:mt-12 sm:p-12">
            No saved homes yet. Tap the bookmark on any listing, then come back here.
            <div className="mt-4">
              <Link
                to="/properties"
                className="inline-flex min-h-[44px] items-center rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Browse listings
              </Link>
            </div>
          </div>
        )}

        {properties.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
