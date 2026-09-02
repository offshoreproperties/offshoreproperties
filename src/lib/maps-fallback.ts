type MapPoint = { latitude: number; longitude: number };

/** Free embed map when Google Static/JS APIs are unavailable. */
export function buildOsmEmbedUrl(
  points: MapPoint[],
  options?: { height?: number },
): string | null {
  if (!points.length) return null;

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const pad = points.length === 1 ? 0.015 : 0.04;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  const marker = points[0];

  const params = new URLSearchParams({
    bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
    layer: "mapnik",
    marker: `${marker.latitude},${marker.longitude}`,
  });

  if (options?.height) {
    params.set("height", String(options.height));
  }

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
