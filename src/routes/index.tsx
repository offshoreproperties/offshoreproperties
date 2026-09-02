import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { HavenlyHero } from "@/components/home/havenly-hero";
import { HomeTabStrip } from "@/components/home/home-tab-strip";
import { HomePropertyFilters } from "@/components/home/home-property-filters";
import { HomeListingsMap } from "@/components/home/home-listings-map";
import { HomeListingsSection } from "@/components/home/home-listings-section";
import type { HomeTab } from "@/components/public-header";
import { listProperties } from "@/lib/properties.functions";
import { listPropertiesForMap } from "@/lib/maps.functions";
import type { MapListing } from "@/lib/maps.functions";
import { BRAND } from "@/lib/constants";
import { z } from "zod";

const homeSearchSchema = z.object({
  tab: z.enum(["all", "buy", "rent"]).optional().catch("all"),
});

export const Route = createFileRoute("/")({
  validateSearch: (s) => homeSearchSchema.parse(s),
  loader: async () => {
    const empty = { rows: [] as Awaited<ReturnType<typeof listProperties>>["rows"], total: 0 };
    let initialProperties = empty;
    let initialMapProperties: MapListing[] = [];

    try {
      initialProperties = await listProperties({ data: { limit: 100 } });
    } catch (error) {
      console.error("[home] Failed to preload listings:", error);
    }

    try {
      initialMapProperties = await listPropertiesForMap();
    } catch (error) {
      console.error("[home] Failed to preload map listings:", error);
    }

    return { initialProperties, initialMapProperties };
  },
  head: () => ({
    meta: [
      { title: `${BRAND.name} — find the right home in Kenya` },
      {
        name: "description",
        content: BRAND.tagline,
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
  const { initialProperties, initialMapProperties } = Route.useLoaderData();
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["properties", "home-all"],
    queryFn: () => fetchProperties({ data: { limit: 100 } }),
    initialData: initialProperties,
    staleTime: 60_000,
  });

  const all = data?.rows ?? [];

  const listings = useMemo(() => {
    if (homeTab === "buy") return all.filter((p) => p.listing_type === "sale");
    if (homeTab === "rent")
      return all.filter((p) => p.listing_type === "rent" || p.listing_type === "short_let");
    return all;
  }, [all, homeTab]);

  const sectionTitle =
    homeTab === "buy"
      ? "Homes for sale right now"
      : homeTab === "rent"
        ? "Rentals worth viewing"
        : "What's on the market";

  const collectionSearch =
    homeTab === "buy"
      ? { listingType: "sale" as const }
      : homeTab === "rent"
        ? { listingType: "rent" as const }
        : {};

  const cardListings = useMemo(
    () =>
      listings.map((p) => ({
        ...p,
        hero_image: propertyImage(p) || p.hero_image,
      })),
    [listings],
  );

  return (
    <div className="min-h-dvh-screen bg-[#f8fafc]">
      <HavenlyHero homeTab={homeTab} onHomeTabChange={setTab} />

      <HomeTabStrip active={homeTab} onChange={setTab} />

      <HomePropertyFilters homeTab={homeTab} />

      <section className="relative z-10 -mt-5 px-3 pb-8 safe-bottom pt-0 sm:-mt-6 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md">
          <HomeListingsMap
            homeTab={homeTab}
            embedded
            initialProperties={initialMapProperties}
          />
          <HomeListingsSection
            listings={cardListings}
            isLoading={isLoading && all.length === 0}
            loadFailed={isError && all.length === 0}
            allCount={all.length}
            homeTab={homeTab}
            sectionTitle={sectionTitle}
            collectionSearch={collectionSearch}
          />
        </div>
      </section>
    </div>
  );
}
