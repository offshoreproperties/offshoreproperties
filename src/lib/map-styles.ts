export const MAP_PIN_COLORS: Record<string, string> = {
  villa: "#2563eb",
  apartment: "#60a5fa",
  townhouse: "#f472b6",
  land: "#fbbf24",
  commercial: "#a78bfa",
};

export function pinColor(propertyType: string) {
  return MAP_PIN_COLORS[propertyType] ?? "#ffffff";
}
