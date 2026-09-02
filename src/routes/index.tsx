import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { HavenlyHero } from "@/components/home/havenly-hero";
import { HomeTabStrip } from "@/components/home/home-tab-strip";
import { HomeListingsMap } from "@/components/home/home-listings-map";
import { LocationBrowse } from "@/components/location-browse";
import { PropertyCard } from "@/components/property-card";
import { listProperties } from "@/lib/properties.functions";
import { BRAND } from "@/lib/constants";
import type { HomeTab } from "@/components/public-header";
import { z } from "zod";

const homeSearchSchema = z.object({
  tab: z.enum(["all", "buy", "rent"]).optional().catch("all"),
});

export const Route = createFileRoute("/")({
  validateSearch: (s) => homeSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: `${BRAND.name} — Your Next Investment, Simplified` },
      {
        name: "description",
        content: "Explore curated properties — search, filter, and discover handpicked listings.",
      },
    ],
  }),
  component: Index,
});

function propertyImage(p: { hero_image: string | null; images: string[] | null }) {
  if (p.hero_image) return p.hero_image;
  const first = p.images?.find((url) => url && !url.includes(","));
  return first ?? "";
}

function Index() {
  const { tab: urlTab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [homeTab, setHomeTab] = useState<HomeTab>(urlTab ?? "all");
  const fetchProperties = useServerFn(listProperties);

  useEffect(() => {
    setHomeTab(urlTab ?? "all");
  }, [urlTab]);

  function setTab(tab: HomeTab) {
    setHomeTab(tab);
    navigate({ search: { tab } });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "home-all"],
    queryFn: () => fetchProperties({ data: { limit: 100 } }),
  });

  const all = data?.rows ?? [];

  const listings = useMemo(() => {
    if (homeTab === "buy") return all.filter((p) => p.listing_type === "sale");
    if (homeTab === "rent")
      return all.filter((p) => p.listing_type === "rent" || p.listing_type === "short_let");
    return all;
  }, [all, homeTab]);

  const sectionTitle =
    homeTab === "buy" ? "Homes for sale" : homeTab === "rent" ? "Homes for rent" : "All listings";

  const collectionSearch =
    homeTab === "buy"
      ? { listingType: "sale" as const }
      : homeTab === "rent"
        ? { listingType: "rent" as const }
        : {};

  return (
    <div className="min-h-dvh-screen bg-[#f8fafc]">
      <HavenlyHero homeTab={homeTab} onHomeTabChange={setTab} />

      <HomeTabStrip active={homeTab} onChange={setTab} />

      <section className="border-b border-black/5 bg-white px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <LocationBrowse />
        </div>
      </section>

      <HomeListingsMap homeTab={homeTab} />

      <section className="px-3 pb-8 safe-bottom sm:px-6 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 sm:text-xs">
                {listings.length} {listings.length === 1 ? "property" : "properties"}
              </p>
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#0a0a0a] sm:text-3xl">
                {sectionTitle}
              </h2>
            </div>
            <Link
              to="/properties"
              search={collectionSearch}
              className="inline-flex min-h-[44px] shrink-0 items-center text-xs font-semibold text-blue-600 transition hover:text-blue-700 sm:text-sm"
            >
              View full collection →
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:mt-6 sm:gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-black/5" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-black/15 py-8 text-center text-sm text-black/50 sm:mt-8 sm:py-12">
              {all.length === 0
                ? "No published listings yet. Add and publish properties in admin."
                : `No ${homeTab === "buy" ? "sale" : "rent"} listings — try All or the other tab.`}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:mt-6 sm:gap-4 lg:grid-cols-3">
              {listings.map((p) => (
                <PropertyCard
                  key={p.id}
                  p={{ ...p, hero_image: propertyImage(p) || p.hero_image }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
