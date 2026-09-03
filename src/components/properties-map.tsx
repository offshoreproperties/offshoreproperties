import { APIProvider, AdvancedMarker, Map, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { formatPrice, formatPriceCompact, propertyTypeLabel } from "@/lib/format";
import { pinColor } from "@/lib/map-styles";
import { getClientGoogleMapsApiKey, getClientGoogleMapId } from "@/lib/google-maps";
import type { MapLocationSource } from "@/lib/map-locations";
import {
  buildLocationLabel,
  googleMapsDirectionsUrl,
  openExternalMaps,
} from "@/lib/maps-url";
import { cn } from "@/lib/utils";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingsMapPreview } from "@/components/listings-map-preview";
import { checkGoogleMapsApi } from "@/lib/maps.functions";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

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
  bedrooms?: number | null;
  bathrooms?: number | null;
  locationSource?: MapLocationSource;
};

function MapOverviewCamera({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.moveCamera({
      center,
      zoom,
      tilt: 45,
      heading: 20,
    });
  }, [map, center.lat, center.lng, zoom]);

  return null;
}

function PropertyMapPin({
  property,
  selected,
  showPrice,
}: {
  property: MapProperty & { latitude: number; longitude: number };
  selected: boolean;
  showPrice: boolean;
}) {
  const approximate = property.locationSource && property.locationSource !== "exact";
  const priceLabel = formatPriceCompact(
    Number(property.price),
    property.currency,
    property.listing_type,
  );

  return (
    <div className="flex flex-col items-center">
      {showPrice ? (
        <div
          className={cn(
            "mb-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md sm:text-[11px]",
            approximate ? "bg-neutral-700" : "bg-[#2563eb]",
          )}
        >
          {approximate ? "~" : ""}
          {priceLabel}
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-transform",
          approximate ? "border-dashed border-neutral-400" : "border-white",
          selected ? "scale-110 ring-2 ring-[#2563eb]" : "hover:scale-105",
        )}
      >
        {property.hero_image ? (
          <img src={property.hero_image} alt="" className="h-12 w-12 object-cover sm:h-14 sm:w-14" />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center text-[10px] font-bold text-white sm:h-14 sm:w-14"
            style={{ background: pinColor(property.property_type) }}
          >
            {propertyTypeLabel(property.property_type).slice(0, 3)}
          </div>
        )}
      </div>
      <div
        className="mt-1 h-2.5 w-2.5 rotate-45 border border-white shadow-sm"
        style={{ background: pinColor(property.property_type) }}
      />
    </div>
  );
}

export function PropertiesMap({
  properties,
  className,
  showPricePins = false,
  interactive = true,
  compactPreview = false,
}: {
  properties: MapProperty[];
  className?: string;
  showPricePins?: boolean;
  /** When false, uses a static map + listing cards (no Maps JavaScript API — avoids Google error modals). */
  interactive?: boolean;
  /** Tighter map + listing cards for the homepage block. */
  compactPreview?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<MapProperty | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const checkMaps = useServerFn(checkGoogleMapsApi);

  const { data: mapsStatus, isLoading: checkingMaps } = useQuery({
    queryKey: ["maps-api-status"],
    queryFn: () => checkMaps(),
    staleTime: 5 * 60_000,
    enabled: ready && interactive && !!apiKey,
  });

  useEffect(() => {
    setApiKey(getClientGoogleMapsApiKey());
    setReady(true);
  }, []);

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setLoadError("failed");
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  const mapId = getClientGoogleMapId();
  const useMapId = mapId && mapId !== "DEMO_MAP_ID";

  const withCoords = properties.filter(
    (p) => p.latitude != null && p.longitude != null,
  ) as (MapProperty & { latitude: number; longitude: number })[];

  if (!ready) {
    return <div className={cn("animate-pulse rounded-xl bg-neutral-100", className)} />;
  }

  if (withCoords.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl bg-slate-100 p-8 text-center",
          className,
        )}
      >
        <MapPin className="mb-3 h-10 w-10 text-slate-400" />
        <p className="font-medium text-slate-900">Nothing on the map yet</p>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          New listings will appear here as we publish them.
        </p>
      </div>
    );
  }

  if (!interactive || !apiKey) {
    return (
      <ListingsMapPreview
        properties={properties}
        className={className}
        showPricePins={showPricePins}
        compact={compactPreview}
      />
    );
  }

  const center = {
    lat: withCoords.reduce((s, p) => s + p.latitude, 0) / withCoords.length,
    lng: withCoords.reduce((s, p) => s + p.longitude, 0) / withCoords.length,
  };
  const zoom = withCoords.length === 1 ? 16 : 11;

  const mapsInteractiveReady = !!apiKey && mapsStatus?.ok && !loadError;

  if (ready && !checkingMaps && !mapsInteractiveReady) {
    return (
      <ListingsMapPreview
        properties={properties}
        className={className}
        showPricePins={showPricePins}
        compact={compactPreview}
      />
    );
  }

  if (loadError) {
    return (
      <ListingsMapPreview
        properties={properties}
        className={className}
        showPricePins={showPricePins}
        compact={compactPreview}
      />
    );
  }

  if (checkingMaps || !mapsStatus?.ok) {
    return <div className={cn("animate-pulse rounded-2xl bg-slate-200", className)} />;
  }

  return (
    <APIProvider
      apiKey={apiKey}
      onError={() => setLoadError("failed")}
    >
      <div className={cn("relative flex h-full min-h-[320px] flex-col", className)}>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
          <Map
            defaultCenter={center}
            defaultZoom={zoom}
            defaultTilt={45}
            defaultHeading={20}
            gestureHandling="greedy"
            disableDefaultUI={false}
            {...(useMapId ? { mapId } : {})}
            className="h-full w-full"
          >
            <MapOverviewCamera center={center} zoom={zoom} />
            {withCoords.map((p) => (
              <AdvancedMarker
                key={p.id}
                position={{ lat: Number(p.latitude), lng: Number(p.longitude) }}
                onClick={() => setSelected(p)}
              >
                <PropertyMapPin property={p} selected={selected?.id === p.id} showPrice={showPricePins} />
              </AdvancedMarker>
            ))}
            {selected && selected.latitude != null && selected.longitude != null && (
              <InfoWindow
                position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="max-w-[260px] p-1">
                  {selected.hero_image && (
                    <img src={selected.hero_image} alt="" className="mb-2 h-24 w-full rounded object-cover" />
                  )}
                  <p className="text-xs uppercase text-neutral-500">{propertyTypeLabel(selected.property_type)}</p>
                  <p className="font-semibold text-neutral-900">{selected.title}</p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatPrice(Number(selected.price), selected.currency, selected.listing_type)}
                  </p>
                  {selected.city && <p className="text-xs text-neutral-500">{selected.city}</p>}
                  {selected.locationSource && selected.locationSource !== "exact" ? (
                    <p className="mt-1 text-[10px] text-neutral-500">
                      ~ Approximate {selected.locationSource === "ai" ? "estimated" : "area"} location
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 w-full gap-2 rounded-full bg-[#2563eb] text-xs text-white hover:bg-[#1d4ed8]"
                      onClick={() =>
                        openExternalMaps(
                          googleMapsDirectionsUrl(Number(selected.latitude), Number(selected.longitude), {
                            label: buildLocationLabel([selected.title, selected.city]),
                          }),
                        )
                      }
                    >
                      <Navigation className="h-3 w-3" />
                      Get directions
                    </Button>
                    <Link
                      to="/properties/$slug"
                      params={{ slug: selected.slug ?? selected.id }}
                      className="inline-flex h-8 items-center justify-center rounded-full border border-neutral-200 text-xs font-medium text-blue-600 hover:bg-neutral-50"
                    >
                      View listing →
                    </Link>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          {compactPreview ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 p-2.5 sm:p-3">
              <span className="pointer-events-auto inline-flex rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200/80 sm:text-xs">
                {withCoords.length} {withCoords.length === 1 ? "listing" : "listings"} on map
              </span>
            </div>
          ) : null}
        </div>

        {!compactPreview ? (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
            {showPricePins ? (
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#2563eb] px-2 py-0.5 text-[10px] font-bold text-white">KES 12M</span>
                Exact location
              </span>
            ) : null}
            {showPricePins ? (
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-bold text-white">~KES 12M</span>
                Approximate area
              </span>
            ) : null}
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
        ) : null}
      </div>
    </APIProvider>
  );
}
