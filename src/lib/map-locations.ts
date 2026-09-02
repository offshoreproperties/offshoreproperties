import { runAiChat } from "@/lib/ai-client";
import { getGoogleMapsApiKey } from "@/lib/google-maps";
import { getStaticMapCoordinates } from "@/lib/kenya-locations";

export type MapLocationSource = "exact" | "geocoded" | "ai";

export type ResolvedMapLocation = {
  latitude: number;
  longitude: number;
  locationSource: MapLocationSource;
};

type PropertyForLocation = {
  id: string;
  title: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const locationCache = new Map<string, ResolvedMapLocation & { expiresAt: number }>();

function cacheKey(property: PropertyForLocation): string {
  return [
    property.id,
    property.latitude ?? "",
    property.longitude ?? "",
    property.address ?? "",
    property.city ?? "",
    property.country ?? "",
  ].join("|");
}

function readCache(key: string): ResolvedMapLocation | null {
  const hit = locationCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    locationCache.delete(key);
    return null;
  }
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    locationSource: hit.locationSource,
  };
}

function writeCache(key: string, value: ResolvedMapLocation) {
  locationCache.set(key, { ...value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function spreadCoordinates(
  lat: number,
  lng: number,
  seed: string,
  source: MapLocationSource,
): { latitude: number; longitude: number } {
  if (source === "exact") return { latitude: lat, longitude: lng };
  const hash = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const angle = ((hash % 360) * Math.PI) / 180;
  const dist = 0.006 + (hash % 7) * 0.002;
  return {
    latitude: lat + Math.cos(angle) * dist,
    longitude: lng + Math.sin(angle) * dist,
  };
}

function geocodeQueries(property: PropertyForLocation): string[] {
  const country = property.country?.trim() || "Kenya";
  const queries: string[] = [];

  if (property.address?.trim()) {
    queries.push([property.address, property.city, country].filter(Boolean).join(", "));
  }
  if (property.city?.trim()) {
    queries.push(`${property.city}, ${country}`);
  }
  if (property.title?.trim()) {
    queries.push(`${property.title}, ${property.city ?? country}`);
  }

  return [...new Set(queries)];
}

async function geocodeQuery(query: string, apiKey: string) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
  );
  const json = (await res.json()) as {
    status: string;
    results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };
  if (json.status !== "OK" || !json.results?.[0]) return null;
  const { lat, lng } = json.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}

async function aiInferLocation(property: PropertyForLocation): Promise<ResolvedMapLocation | null> {
  try {
    const response = await runAiChat([
      {
        role: "system",
        content:
          "You estimate approximate map coordinates for Kenyan real estate listings. Reply with JSON only: {\"latitude\": number, \"longitude\": number}. Prefer neighbourhood or city-centre accuracy. Coordinates must be inside Kenya.",
      },
      {
        role: "user",
        content: JSON.stringify({
          title: property.title,
          address: property.address,
          city: property.city,
          country: property.country ?? "Kenya",
          description: property.description?.slice(0, 400) ?? null,
        }),
      },
    ]);

    const match = response.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { latitude?: number; longitude?: number };
    if (
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      parsed.latitude < -5 ||
      parsed.latitude > 5 ||
      parsed.longitude < 33 ||
      parsed.longitude > 42
    ) {
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      locationSource: "ai",
    };
  } catch {
    return null;
  }
}

export async function resolvePropertyMapLocation(
  property: PropertyForLocation,
): Promise<ResolvedMapLocation | null> {
  const key = cacheKey(property);
  const cached = readCache(key);
  if (cached) return cached;

  if (property.latitude != null && property.longitude != null) {
    const exact: ResolvedMapLocation = {
      latitude: property.latitude,
      longitude: property.longitude,
      locationSource: "exact",
    };
    writeCache(key, exact);
    return exact;
  }

  const mapsKey = getGoogleMapsApiKey();
  if (mapsKey) {
    for (const query of geocodeQueries(property)) {
      const geocoded = await geocodeQuery(query, mapsKey);
      if (!geocoded) continue;
      const spread = spreadCoordinates(geocoded.latitude, geocoded.longitude, property.id, "geocoded");
      const resolved: ResolvedMapLocation = {
        ...spread,
        locationSource: "geocoded",
      };
      writeCache(key, resolved);
      return resolved;
    }
  }

  const staticCoords = getStaticMapCoordinates(property);
  if (staticCoords) {
    const spread = spreadCoordinates(staticCoords.latitude, staticCoords.longitude, property.id, "geocoded");
    const resolved: ResolvedMapLocation = {
      ...spread,
      locationSource: "geocoded",
    };
    writeCache(key, resolved);
    return resolved;
  }

  const aiGuess = await aiInferLocation(property);
  if (aiGuess) {
    const spread = spreadCoordinates(aiGuess.latitude, aiGuess.longitude, property.id, "ai");
    const resolved: ResolvedMapLocation = {
      ...spread,
      locationSource: "ai",
    };
    writeCache(key, resolved);
    return resolved;
  }

  const fallback = spreadCoordinates(-1.286389, 36.817223, property.id, "ai");
  const resolved: ResolvedMapLocation = {
    ...fallback,
    locationSource: "ai",
  };
  writeCache(key, resolved);
  return resolved;
}

export async function resolvePropertyMapLocations<T extends PropertyForLocation>(
  properties: T[],
): Promise<Array<T & ResolvedMapLocation>> {
  const settled = await Promise.all(
    properties.map(async (property) => {
      const location = await resolvePropertyMapLocation(property);
      return location ? ({ ...property, ...location } as T & ResolvedMapLocation) : null;
    }),
  );
  return settled.filter((row): row is T & ResolvedMapLocation => row != null);
}
