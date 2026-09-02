import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site-layout";
import { PropertiesMap } from "@/components/properties-map";
import { listPropertiesForMap } from "@/lib/maps.functions";
import { BRAND } from "@/lib/constants";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSearchField } from "@/components/ai-search-field";

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Property map — ${BRAND.name}` },
      { name: "description", content: "See every listing on the map — prices, areas, and directions at a glance." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const fetch = useServerFn(listPropertiesForMap);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["map-properties"],
    queryFn: () => fetch(),
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-3 pb-8 safe-bottom sm:px-4 sm:pb-10">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Explore</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              <Map className="h-6 w-6 text-blue-600 sm:h-7 sm:w-7" />
              Property map
            </h1>
            <p className="mt-1 max-w-lg text-sm text-neutral-600">
              See where our listings sit — prices, photos, and directions in one place.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link to="/properties">
              <Button
                variant="outline"
                className="h-10 w-full rounded-full border-neutral-300 text-neutral-900 hover:bg-neutral-50 sm:w-auto"
              >
                List view
              </Button>
            </Link>
            <AiSearchField variant="compact" className="w-full sm:max-w-xs" />
          </div>
        </div>

        <div className="h-[min(70dvh,70vh,640px)] min-h-[320px] sm:min-h-[400px]">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-2xl bg-slate-200" />
          ) : (
            <PropertiesMap properties={properties} className="h-full" showPricePins interactive={false} />
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
