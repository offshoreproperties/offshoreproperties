import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { Navigation, MapPinned, Scan } from "lucide-react";
import { buildStaticMapImageUrl, getClientGoogleMapsApiKey, getClientGoogleMapId } from "@/lib/google-maps";
import { buildOsmEmbedUrl } from "@/lib/maps-fallback";
import {
  buildLocationLabel,
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
  googleMapsStreetViewUrl,
  openExternalMaps,
} from "@/lib/maps-url";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PropertyLocationMapProps = {
  latitude: number;
  longitude: number;
  title: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  heroImage?: string | null;
  className?: string;
};

function Map3DCamera({ position, zoom }: { position: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.moveCamera({
      center: position,
      zoom,
      tilt: zoom >= 15 ? 55 : 0,
      heading: 25,
    });
  }, [map, position.lat, position.lng, zoom]);

  return null;
}

function PropertyPin({ image, title }: { image?: string | null; title: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-[#2563eb]/30 blur-md" />
        <div className="relative overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xl">
          {image ? (
            <img src={image} alt="" className="h-16 w-16 object-cover sm:h-20 sm:w-20" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center bg-[#2563eb] text-xs font-semibold text-white sm:h-20 sm:w-20">
              {title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 h-3 w-3 rotate-45 border border-white bg-[#2563eb] shadow-sm" />
    </div>
  );
}

export function PropertyLocationMap({
  latitude,
  longitude,
  title,
  address,
  city,
  country,
  heroImage,
  className,
}: PropertyLocationMapProps) {
  const [ready, setReady] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "flat">("3d");
  const [mapFailed, setMapFailed] = useState(false);
  const [staticFailed, setStaticFailed] = useState(false);
  const apiKey = ready ? getClientGoogleMapsApiKey() : undefined;
  const mapId = getClientGoogleMapId();
  const useMapId = mapId && mapId !== "DEMO_MAP_ID";
  const position = { lat: latitude, lng: longitude };
  const label = buildLocationLabel([title, address, city, country]);
  const zoom = viewMode === "3d" ? 17 : 15;

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => setMapFailed(true);
    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  const staticUrl =
    apiKey && !staticFailed
      ? buildStaticMapImageUrl([{ latitude, longitude }], apiKey, { zoom: 16, width: 800, height: 480 })
      : null;

  const osmEmbedUrl = !staticUrl ? buildOsmEmbedUrl([{ latitude, longitude }]) : null;

  const showInteractiveMap = apiKey && !mapFailed;

  if (!ready) {
    return <div className={cn("h-64 animate-pulse rounded-2xl bg-neutral-100 sm:h-80", className)} />;
  }

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        className="h-9 gap-2 rounded-full bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
        onClick={() => openExternalMaps(googleMapsDirectionsUrl(latitude, longitude, { label }))}
      >
        <Navigation className="h-3.5 w-3.5" />
        Get directions
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 gap-2 rounded-full border-neutral-300"
        onClick={() => openExternalMaps(googleMapsPlaceUrl(latitude, longitude, label))}
      >
        <MapPinned className="h-3.5 w-3.5" />
        Open in Google Maps
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 gap-2 rounded-full border-neutral-300"
        onClick={() => openExternalMaps(googleMapsStreetViewUrl(latitude, longitude))}
      >
        <Scan className="h-3.5 w-3.5" />
        Street View
      </Button>
      {showInteractiveMap ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 rounded-full text-neutral-600"
          onClick={() => setViewMode((mode) => (mode === "3d" ? "flat" : "3d"))}
        >
          {viewMode === "3d" ? "Flat map" : "3D view"}
        </Button>
      ) : null}
    </div>
  );

  if (!showInteractiveMap) {
    return (
      <div className={cn("space-y-3", className)}>
        {actionButtons}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-slate-900 shadow-sm">
          {staticUrl ? (
            <img
              src={staticUrl}
              alt=""
              className="h-64 w-full object-cover opacity-90 sm:h-80"
              onError={() => setStaticFailed(true)}
            />
          ) : osmEmbedUrl ? (
            <iframe
              title="Property location map"
              src={osmEmbedUrl}
              className="h-64 w-full border-0 opacity-90 sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div
              className="h-64 sm:h-80"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 25%) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-white/70">Use the buttons above for directions in Google Maps</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {actionButtons}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
        <APIProvider apiKey={apiKey} onError={() => setMapFailed(true)}>
          <Map
            defaultCenter={position}
            defaultZoom={zoom}
            defaultTilt={viewMode === "3d" ? 55 : 0}
            defaultHeading={viewMode === "3d" ? 25 : 0}
            gestureHandling="greedy"
            disableDefaultUI={false}
            fullscreenControl
            mapTypeControl={false}
            streetViewControl={false}
            {...(useMapId ? { mapId } : {})}
            className="h-64 w-full sm:h-80"
          >
            <Map3DCamera position={position} zoom={zoom} />
            <AdvancedMarker position={position}>
              <PropertyPin image={heroImage} title={title} />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
