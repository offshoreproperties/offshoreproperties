import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { Navigation, MapPinned, Scan } from "lucide-react";
import { getClientGoogleMapsApiKey, getClientGoogleMapId } from "@/lib/google-maps";
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
  const apiKey = ready ? getClientGoogleMapsApiKey() : undefined;
  const mapId = getClientGoogleMapId();
  const useMapId = mapId && mapId !== "DEMO_MAP_ID";
  const position = { lat: latitude, lng: longitude };
  const label = buildLocationLabel([title, address, city, country]);
  const zoom = viewMode === "3d" ? 17 : 15;

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div className={cn("h-64 animate-pulse rounded-2xl bg-neutral-100 sm:h-80", className)} />;
  }

  if (!apiKey) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-600", className)}>
        Map preview unavailable — Google Maps API key not configured.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
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
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 rounded-full text-neutral-600"
          onClick={() => setViewMode((mode) => (mode === "3d" ? "flat" : "3d"))}
        >
          {viewMode === "3d" ? "Flat map" : "3D view"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
        <APIProvider apiKey={apiKey}>
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
