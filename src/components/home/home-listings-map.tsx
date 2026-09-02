import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { PropertiesMap } from "@/components/properties-map";
import { LocationBrowse } from "@/components/location-browse";
import { listPropertiesForMap } from "@/lib/maps.functions";
import type { HomeTab } from "@/components/public-header";
import { Map, ArrowUpRight } from "lucide-react";

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

  return (
    <section className="relative z-20 -mt-6 px-3 pb-4 pt-0 sm:-mt-8 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/30">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                <Map className="h-3 w-3" />
                Explore Kenya
              </p>
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Pick an area, see what&apos;s available
              </h2>
            </div>
            <Link
              to="/map"
              className="group inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 sm:h-9 sm:px-4"
            >
              Full map
              <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="bg-slate-100 p-2 sm:p-3">
            <LocationBrowse compact className="mb-2 px-0.5" />
            <div className="h-[min(40dvh,380px)] min-h-[260px] sm:min-h-[300px]">
              {isLoading ? (
                <div className="h-full animate-pulse rounded-2xl bg-slate-200" />
              ) : (
                <PropertiesMap
                  properties={filtered}
                  className="h-full"
                  showPricePins
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
