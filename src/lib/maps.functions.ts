import { createServerFn } from "@tanstack/react-start";
import { supabaseAnonServer } from "@/integrations/supabase/client.anon-server";
import { getGoogleMapsApiKey, googleMapsConfigError } from "@/lib/google-maps";
import { resolvePropertyMapLocations, type MapLocationSource } from "@/lib/map-locations";

export type MapListing = {
  id: string;
  title: string;
  slug: string | null;
  property_type: string;
  listing_type: string;
  price: number;
  currency: string;
  city: string | null;
  hero_image: string | null;
  latitude: number;
  longitude: number;
  bedrooms: number | null;
  bathrooms: number | null;
  locationSource: MapLocationSource;
};

/** All published listings with resolved map coordinates (exact pin, geocoded, or AI estimate). */
export const listPropertiesForMap = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAnonServer
    .from("properties")
    .select(
      "id, title, slug, property_type, listing_type, price, currency, city, country, address, description, hero_image, latitude, longitude, bedrooms, bathrooms",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];
  const resolved = await resolvePropertyMapLocations(rows);

  return resolved.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    property_type: p.property_type,
    listing_type: p.listing_type,
    price: p.price,
    currency: p.currency,
    city: p.city,
    hero_image: p.hero_image,
    latitude: p.latitude,
    longitude: p.longitude,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    locationSource: p.locationSource,
  })) satisfies MapListing[];
});

const REQUIRED_MAPS_APIS = [
  "Maps JavaScript API",
  "Maps Static API",
  "Geocoding API",
] as const;

/** Quick health check — Geocoding API must be enabled for admin geocode + this probe. */
export const checkGoogleMapsApi = createServerFn({ method: "GET" }).handler(async () => {
  const key = getGoogleMapsApiKey();
  if (!key) {
    return {
      ok: false as const,
      reason: "missing" as const,
      message: googleMapsConfigError(),
      apis: [] as string[],
    };
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent("Nairobi, Kenya")}&key=${key}`,
  );
  const json = (await res.json()) as {
    status: string;
    error_message?: string;
  };

  if (json.status === "OK") {
    return {
      ok: true as const,
      reason: "ok" as const,
      message: "Google Maps API key is working.",
      apis: [...REQUIRED_MAPS_APIS],
    };
  }

  const err = json.error_message ?? json.status;
  const invalidKey =
    err.toLowerCase().includes("invalid") ||
    err.toLowerCase().includes("expired") ||
    json.status === "REQUEST_DENIED" && err.toLowerCase().includes("api key");

  if (invalidKey) {
    return {
      ok: false as const,
      reason: "invalid" as const,
      message:
        "Your Google Maps API key is invalid or was revoked. Create a new key in Google Cloud Console, enable billing + Maps JavaScript, Static Maps, and Geocoding APIs, then update VITE_GOOGLE_MAPS_API_KEY and GOOGLE_MAPS_API_KEY in Render and redeploy.",
      detail: err,
      apis: [...REQUIRED_MAPS_APIS],
    };
  }

  const needsEnable =
    err.includes("not activated") ||
    json.status === "REQUEST_DENIED";

  return {
    ok: false as const,
    reason: "disabled" as const,
    message: needsEnable
      ? "API key found, but Maps APIs are not enabled. In Google Cloud Console enable Maps JavaScript API, Maps Static API, and Geocoding API, turn on billing, restrict the key to your domain, then redeploy."
      : err,
    detail: needsEnable ? err : undefined,
    apis: [...REQUIRED_MAPS_APIS],
  };
});
