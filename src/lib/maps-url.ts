export type MapCoordinates = {
  lat: number;
  lng: number;
};

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Open the place in Google Maps (app or web). */
export function googleMapsPlaceUrl(lat: number, lng: number, label?: string): string {
  const query = label?.trim()
    ? encodeURIComponent(label.trim())
    : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Launch turn-by-turn directions in Google Maps. */
export function googleMapsDirectionsUrl(
  lat: number,
  lng: number,
  options?: { label?: string; travelMode?: "driving" | "walking" | "bicycling" | "transit" },
): string {
  const destination = options?.label?.trim()
    ? encodeURIComponent(options.label.trim())
    : `${lat},${lng}`;
  const mode = options?.travelMode ?? "driving";
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`;
}

/** Street View deep link for a coordinate. */
export function googleMapsStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

/** Extract coordinates from a pasted Google Maps share link. */
export function parseGoogleMapsUrl(input: string): MapCoordinates | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };
  }

  const dMatch = trimmed.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (dMatch) {
    return { lat: Number(dMatch[1]), lng: Number(dMatch[2]) };
  }

  const queryMatch = trimmed.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) };
  }

  const bareCoords = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (bareCoords) {
    return { lat: Number(bareCoords[1]), lng: Number(bareCoords[2]) };
  }

  return null;
}

export function buildLocationLabel(parts: Array<string | null | undefined>): string | undefined {
  const label = parts.filter(Boolean).join(", ");
  return label || undefined;
}

export function openExternalMaps(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
