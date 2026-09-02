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
    <section className="px-3 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-2xl">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <Map className="h-4 w-4" />
                  Explore Kenya
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Pick an area, see what&apos;s available
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  Start with a neighbourhood you like — then check prices and locations on the map below.
                </p>
              </div>
              <Link
                to="/map"
                className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
              >
                Full interactive map
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <LocationBrowse compact />
            </div>
          </div>

          <div className="bg-slate-100 p-3 sm:p-4">
            <div className="h-[min(56dvh,540px)] min-h-[340px]">
              {isLoading ? (
                <div className="h-full animate-pulse rounded-2xl bg-slate-200" />
              ) : (
                <PropertiesMap
                  properties={filtered}
                  className="h-full"
                  showPricePins
                  interactive={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
