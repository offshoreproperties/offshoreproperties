import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { PropertiesMap } from "@/components/properties-map";
import { listPropertiesForMap } from "@/lib/maps.functions";
import type { HomeTab } from "@/components/public-header";
import { Map } from "lucide-react";

type HomeListingsMapProps = {
  homeTab: HomeTab;
};

export function HomeListingsMap({ homeTab }: HomeListingsMapProps) {
  const fetchMap = useServerFn(listPropertiesForMap);
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["home-map-properties"],
    queryFn: () => fetchMap(),
    staleTime: 5 * 60_000,
  });

  const filtered = useMemo(() => {
    if (homeTab === "buy") return properties.filter((p) => p.listing_type === "sale");
    if (homeTab === "rent") {
      return properties.filter((p) => p.listing_type === "rent" || p.listing_type === "short_let");
    }
    return properties;
  }, [properties, homeTab]);

  const approximateCount = filtered.filter((p) => p.locationSource !== "exact").length;

  return (
    <section className="border-y border-black/5 bg-white px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-blue-600 sm:text-xs">
              <Map className="h-3.5 w-3.5" />
              Live map
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0a0a0a] sm:text-3xl">
              Explore listings on the map
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">
              Every pin shows price and property type. Exact pins use admin-set locations; others are placed from
              address or AI when coordinates are missing.
            </p>
            {!isLoading && filtered.length > 0 ? (
              <p className="mt-2 text-xs text-neutral-500">
                {filtered.length} {filtered.length === 1 ? "listing" : "listings"} on map
                {approximateCount > 0
                  ? ` · ${approximateCount} approximate ${approximateCount === 1 ? "area" : "areas"}`
                  : ""}
              </p>
            ) : null}
          </div>
          <Link
            to="/map"
            className="inline-flex min-h-[44px] shrink-0 items-center text-xs font-semibold text-blue-600 transition hover:text-blue-700 sm:text-sm"
          >
            Open full map →
          </Link>
        </div>

        <div className="mt-5 h-[min(58dvh,520px)] min-h-[300px] sm:mt-6">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-2xl bg-neutral-100" />
          ) : (
            <PropertiesMap properties={filtered} className="h-full" showPricePins />
          )}
        </div>
      </div>
    </section>
  );
}
