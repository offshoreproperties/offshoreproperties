function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || trimmed === "your_google_maps_api_key") return undefined;
  return trimmed;
}

/** Client-side Maps JS key (Vite inlines import.meta.env at build time) */
export function getClientGoogleMapsApiKey(): string | undefined {
  return cleanEnvValue(import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined);
}

export function getClientGoogleMapId(): string {
  return cleanEnvValue(import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || "DEMO_MAP_ID";
}

/** Server geocoding + SSR fallback */
export function getGoogleMapsApiKey(): string | undefined {
  return (
    cleanEnvValue(process.env.GOOGLE_MAPS_API_KEY) ||
    cleanEnvValue(process.env.VITE_GOOGLE_MAPS_API_KEY) ||
    getClientGoogleMapsApiKey()
  );
}

type StaticMapPoint = { latitude: number; longitude: number };

/** Static map image — works without Maps JavaScript API (needs Static Maps API enabled). */
export function buildStaticMapImageUrl(
  points: StaticMapPoint[],
  apiKey: string,
  options?: { width?: number; height?: number; zoom?: number },
): string | null {
  if (!points.length || !apiKey) return null;

  const width = options?.width ?? 1200;
  const height = options?.height ?? 640;
  const center = {
    lat: points.reduce((s, p) => s + p.latitude, 0) / points.length,
    lng: points.reduce((s, p) => s + p.longitude, 0) / points.length,
  };
  const zoom = options?.zoom ?? (points.length === 1 ? 14 : 11);

  const markers = points
    .slice(0, 12)
    .map((p) => `markers=color:0x2563eb|size:mid|${p.latitude},${p.longitude}`)
    .join("&");

  const params = new URLSearchParams({
    center: `${center.lat},${center.lng}`,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: "2",
    maptype: "roadmap",
    key: apiKey,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}&${markers}`;
}

export function googleMapsConfigError(): string {
  return "Add VITE_GOOGLE_MAPS_API_KEY to your .env file (Google Cloud → enable Geocoding API), then restart npm run dev.";
}
