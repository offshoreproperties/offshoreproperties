import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin } from "lucide-react";
import type { MapProperty } from "@/components/properties-map";
import { buildStaticMapImageUrl, getClientGoogleMapsApiKey } from "@/lib/google-maps";
import { buildOsmEmbedUrl } from "@/lib/maps-fallback";
import { checkGoogleMapsApi } from "@/lib/maps.functions";
import { cn } from "@/lib/utils";

export function ListingsMapPreview({
  properties,
  className,
}: {
  properties: MapProperty[];
  className?: string;
  showPricePins?: boolean;
  compact?: boolean;
}) {
  const [apiKey, setApiKey] = useState<string | undefined>();
  const [staticFailed, setStaticFailed] = useState(false);
  const checkMaps = useServerFn(checkGoogleMapsApi);

  const { data: mapsStatus } = useQuery({
    queryKey: ["maps-api-status"],
    queryFn: () => checkMaps(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    setApiKey(getClientGoogleMapsApiKey());
  }, []);

  const withCoords = properties.filter(
    (p) => p.latitude != null && p.longitude != null,
  ) as (MapProperty & { latitude: number; longitude: number })[];

  const googleOk = mapsStatus?.ok === true;
  const staticUrl =
    googleOk && apiKey && withCoords.length && !staticFailed
      ? buildStaticMapImageUrl(withCoords, apiKey, { width: 800, height: 400 })
      : null;

  const osmEmbedUrl =
    withCoords.length && (!googleOk || staticFailed || !staticUrl)
      ? buildOsmEmbedUrl(withCoords)
      : null;

  if (!withCoords.length) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center",
          className,
        )}
      >
        <MapPin className="mb-3 h-10 w-10 text-slate-400" />
        <p className="font-medium text-slate-900">Listings coming soon</p>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          New homes will appear on the map as we publish them.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full min-h-[280px] overflow-hidden rounded-xl", className)}>
      <div className="absolute inset-0 bg-slate-100">
        {osmEmbedUrl ? (
          <iframe
            title="Map of listing locations"
            src={osmEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : staticUrl ? (
          <img
            src={staticUrl}
            alt="Map of listing locations in Kenya"
            className="h-full w-full object-cover"
            onError={() => setStaticFailed(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 px-4 text-center">
            <MapPin className="h-8 w-8 text-blue-500/70" />
            <p className="text-sm font-medium text-slate-700">Map preview loading…</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 p-2.5 sm:p-3">
        <span className="inline-flex rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200/80 sm:text-xs">
          {withCoords.length} {withCoords.length === 1 ? "listing" : "listings"} on map
        </span>
      </div>
    </div>
  );
}
