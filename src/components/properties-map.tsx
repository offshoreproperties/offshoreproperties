import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatPrice, propertyTypeLabel } from "@/lib/format";
import { pinColor } from "@/lib/map-styles";
import { getClientGoogleMapsApiKey, getClientGoogleMapId } from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export type MapProperty = {
  id: string;
  title: string;
  slug: string | null;
  property_type: string;
  listing_type: string;
  price: number;
  currency: string;
  city: string | null;
  hero_image: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function PropertiesMap({
  properties,
  className,
}: {
  properties: MapProperty[];
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<MapProperty | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(getClientGoogleMapsApiKey());
    setReady(true);
  }, []);

  const mapId = getClientGoogleMapId();
  const useMapId = mapId && mapId !== "DEMO_MAP_ID";

  const withCoords = properties.filter(
    (p) => p.latitude != null && p.longitude != null,
  ) as (MapProperty & { latitude: number; longitude: number })[];

  if (!ready) {
    return <div className={cn("animate-pulse rounded-xl bg-neutral-100", className)} />;
  }

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center",
          className,
        )}
      >
        <MapPin className="mb-3 h-10 w-10 text-neutral-400" />
        <p className="font-medium text-neutral-900">Google Maps not configured</p>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          Add <code className="rounded bg-neutral-200 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to your{" "}
          <code className="rounded bg-neutral-200 px-1">.env</code> file, enable Maps JavaScript API, then restart{" "}
          <code className="rounded bg-neutral-200 px-1">npm run dev</code>.
        </p>
      </div>
    );
  }

  if (withCoords.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center",
          className,
        )}
      >
        <MapPin className="mb-3 h-10 w-10 text-neutral-400" />
        <p className="font-medium text-neutral-900">No properties on the map yet</p>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          Published listings need a location. In admin, open a property and use &ldquo;Find on map&rdquo; to set coordinates.
        </p>
      </div>
    );
  }

  const center = {
    lat: withCoords.reduce((s, p) => s + p.latitude, 0) / withCoords.length,
    lng: withCoords.reduce((s, p) => s + p.longitude, 0) / withCoords.length,
  };

  return (
    <APIProvider
      apiKey={apiKey}
      onError={(e) => setLoadError(e instanceof Error ? e.message : "Could not load Google Maps")}
    >
      <div className={cn("flex h-full min-h-[320px] flex-col", className)}>
        {loadError && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Map failed to load: {loadError}. Enable Maps JavaScript API for this key in Google Cloud Console.
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
          <Map
            defaultCenter={center}
            defaultZoom={withCoords.length === 1 ? 14 : 11}
            gestureHandling="greedy"
            disableDefaultUI={false}
            {...(useMapId ? { mapId } : {})}
            className="h-full w-full"
          >
            {withCoords.map((p) => (
              <Marker
                key={p.id}
                position={{ lat: Number(p.latitude), lng: Number(p.longitude) }}
                onClick={() => setSelected(p)}
              />
            ))}
            {selected && selected.latitude != null && selected.longitude != null && (
              <InfoWindow
                position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="max-w-[220px] p-1">
                  {selected.hero_image && (
                    <img src={selected.hero_image} alt="" className="mb-2 h-24 w-full rounded object-cover" />
                  )}
                  <p className="text-xs uppercase text-neutral-500">{propertyTypeLabel(selected.property_type)}</p>
                  <p className="font-semibold text-neutral-900">{selected.title}</p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatPrice(Number(selected.price), selected.currency, selected.listing_type)}
                  </p>
                  {selected.city && <p className="text-xs text-neutral-500">{selected.city}</p>}
                  <Link
                    to="/properties/$slug"
                    params={{ slug: selected.slug ?? selected.id }}
                    className="mt-2 inline-block text-xs font-medium text-blue-600 underline"
                  >
                    View listing →
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-600">
          {Object.entries({
            villa: "Villas",
            apartment: "Apartments",
            townhouse: "Townhouses",
            land: "Land",
            commercial: "Commercial",
          }).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: pinColor(k) }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </APIProvider>
  );
}
