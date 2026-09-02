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

/** Quick health check — Geocoding API must be enabled for admin geocode + this probe. */
export const checkGoogleMapsApi = createServerFn({ method: "GET" }).handler(async () => {
  const key = getGoogleMapsApiKey();
  if (!key) {
    return {
      ok: false as const,
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
      message: "Google Maps API key is working.",
      apis: ["Geocoding API"],
    };
  }

  const err = json.error_message ?? json.status;
  const needsEnable =
    err.includes("not activated") ||
    err.includes("REQUEST_DENIED") ||
    json.status === "REQUEST_DENIED";

  return {
    ok: false as const,
    message: needsEnable
      ? "Your API key is valid, but Maps APIs are not turned on for this Google Cloud project. Enable the three APIs below, turn on billing (Google requires it even for free usage), then wait 1–2 minutes and refresh."
      : err,
    detail: needsEnable ? err : undefined,
    apis: ["Maps JavaScript API", "Geocoding API", "Maps Embed API"],
  };
});
