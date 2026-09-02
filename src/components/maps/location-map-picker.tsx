import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import { getClientGoogleMapsApiKey, getClientGoogleMapId } from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 }; // Nairobi

type LocationMapPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
};

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (event: { latLng?: { lat: () => number; lng: () => number } | null }) => {
      const lat = event.latLng?.lat();
      const lng = event.latLng?.lng();
      if (lat == null || lng == null) return;
      onPick(lat, lng);
    });
    return () => listener.remove();
  }, [map, onPick]);

  return null;
}

function MapRecenter({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !position) return;
    map.panTo(position);
  }, [map, position?.lat, position?.lng]);

  return null;
}

export function LocationMapPicker({ latitude, longitude, onChange, className }: LocationMapPickerProps) {
  const [ready, setReady] = useState(false);
  const apiKey = ready ? getClientGoogleMapsApiKey() : undefined;
  const mapId = getClientGoogleMapId();
  const useMapId = mapId && mapId !== "DEMO_MAP_ID";

  const position =
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;

  const center = position ?? DEFAULT_CENTER;

  useEffect(() => {
    setReady(true);
  }, []);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      onChange({ latitude: lat, longitude: lng });
    },
    [onChange],
  );

  if (!ready) {
    return <div className={cn("h-72 animate-pulse rounded-xl bg-muted", className)} />;
  }

  if (!apiKey) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground", className)}>
        <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
        Add <code className="rounded bg-muted px-1">VITE_GOOGLE_MAPS_API_KEY</code> to enable the interactive map picker.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
        <Map
          defaultCenter={center}
          defaultZoom={position ? 16 : 11}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl
          streetViewControl
          {...(useMapId ? { mapId } : {})}
          className="h-72 w-full"
        >
          <MapClickHandler onPick={handlePick} />
          <MapRecenter position={position} />
          {position ? (
            <AdvancedMarker
              position={position}
              draggable
              onDragEnd={(event) => {
                const lat = event.latLng?.lat();
                const lng = event.latLng?.lng();
                if (lat == null || lng == null) return;
                handlePick(lat, lng);
              }}
            >
              <div className="flex flex-col items-center">
                <div className="rounded-full border-2 border-white bg-[#2563eb] p-2 shadow-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="mt-1 h-3 w-3 rotate-45 border border-white bg-[#2563eb] shadow-sm" />
              </div>
            </AdvancedMarker>
          ) : null}
        </Map>
        <p className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Click the map or drag the pin to set the exact property location.
        </p>
      </div>
    </APIProvider>
  );
}
