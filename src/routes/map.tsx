import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site-layout";
import { PropertiesMap } from "@/components/properties-map";
import { listPropertiesForMap } from "@/lib/social.functions";
import { checkGoogleMapsApi } from "@/lib/maps.functions";
import { BRAND } from "@/lib/constants";
import { AiSearchField } from "@/components/ai-search-field";
import { Map, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Property map — ${BRAND.name}` },
      { name: "description", content: "Explore all listings on an interactive map." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const fetch = useServerFn(listPropertiesForMap);
  const checkMaps = useServerFn(checkGoogleMapsApi);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["map-properties"],
    queryFn: () => fetch(),
  });

  const { data: mapsStatus } = useQuery({
    queryKey: ["maps-api-status"],
    queryFn: () => checkMaps(),
    staleTime: 5 * 60_000,
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-3 pb-8 safe-bottom sm:px-4 sm:pb-10">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Explore</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              <Map className="h-6 w-6 text-blue-600 sm:h-7 sm:w-7" />
              Property map
            </h1>
            <p className="mt-1 max-w-lg text-sm text-neutral-600">
              Every pin is a published listing. Tap a pin for details.
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

        {mapsStatus && !mapsStatus.ok && (
          <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Google Maps setup required</p>
              <p className="mt-1 text-amber-900/90">{mapsStatus.message}</p>
              {"detail" in mapsStatus && mapsStatus.detail && (
                <p className="mt-1 text-xs text-amber-800/90">{mapsStatus.detail}</p>
              )}
              {mapsStatus.apis.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-amber-900">
                  <li>
                    <a
                      href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      Enable Maps JavaScript API →
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      Enable Geocoding API →
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://console.cloud.google.com/apis/library/maps-embed-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      Enable Maps Embed API →
                    </a>
                  </li>
                </ul>
              )}
              <p className="mt-3 text-xs text-amber-800">
                Then under Credentials → your API key → Application restrictions, add{" "}
                <code className="rounded bg-amber-100 px-1">http://localhost:8080/*</code>,{" "}
                <code className="rounded bg-amber-100 px-1">https://offshoreproperties.co.ke/*</code>, and{" "}
                <code className="rounded bg-amber-100 px-1">https://www.offshoreproperties.co.ke/*</code>
              </p>
            </div>
          </div>
        )}

        <div className="h-[min(70vh,640px)] min-h-[360px]">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-xl bg-neutral-100" />
          ) : (
            <PropertiesMap properties={properties} className="h-full" />
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
