export type KenyaArea = {
  id: string;
  label: string;
  city: string;
  latitude: number;
  longitude: number;
  county?: string;
  keywords: string[];
  /** Area intelligence for the AI sales advisor */
  highlights: string[];
  nearby: string[];
  lifestyle: string;
};

/** City-centre coordinates for listings without a finer address */
export const KENYA_CITY_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  nairobi: { latitude: -1.286389, longitude: 36.817223 },
  mombasa: { latitude: -4.043477, longitude: 39.668206 },
  kisumu: { latitude: -0.091702, longitude: 34.767956 },
  nakuru: { latitude: -0.303099, longitude: 36.080025 },
  eldoret: { latitude: 0.514277, longitude: 35.269779 },
  kwale: { latitude: -4.322447, longitude: 39.589221 },
  kenya: { latitude: -1.286389, longitude: 36.817223 },
};

export const KENYA_BROWSE_LOCATIONS: KenyaArea[] = [
  {
    id: "kilimani",
    label: "Kilimani",
    city: "Nairobi",
    latitude: -1.2921,
    longitude: 36.787,
    keywords: ["kilimani", "yaya", "argwings kodhek"],
    highlights: ["Walkable dining strip", "Strong rental demand", "Close to CBD without the congestion"],
    nearby: ["Yaya Centre", "Adlife Plaza", "Nairobi Hospital", "Junction Mall (short drive)"],
    lifestyle: "Urban professionals, expats, and young families who want cafés, gyms, and quick CBD access.",
  },
  {
    id: "westlands",
    label: "Westlands",
    city: "Nairobi",
    latitude: -1.2684,
    longitude: 36.811,
    keywords: ["westlands", "sarit", "ring road"],
    highlights: ["Major office and retail hub", "Vibrant nightlife", "Excellent road links"],
    nearby: ["Sarit Centre", "Westgate Mall", "ABC Place", "UN Gigiri (nearby)"],
    lifestyle: "Corporate tenants, investors, and buyers who want convenience and entertainment on the doorstep.",
  },
  {
    id: "karen",
    label: "Karen",
    city: "Nairobi",
    latitude: -1.3197,
    longitude: 36.685,
    keywords: ["karen", "langata", "bogani"],
    highlights: ["Leafy suburban estates", "Larger plots and villas", "Quiet family living"],
    nearby: ["Karen Hub", "Galleria Mall", "Nairobi National Park", "International schools"],
    lifestyle: "Families and executives seeking space, greenery, and prestige addresses.",
  },
  {
    id: "lavington",
    label: "Lavington",
    city: "Nairobi",
    latitude: -1.2798,
    longitude: 36.77,
    keywords: ["lavington", "james gichuru"],
    highlights: ["Established residential prestige", "Mature tree-lined streets", "Strong resale values"],
    nearby: ["Lavington Mall", "Valley Arcade", "Nairobi Hospital", "CBD (15–25 min)"],
    lifestyle: "Upscale homeowners and long-term residents who value privacy and status.",
  },
  {
    id: "runda",
    label: "Runda",
    city: "Nairobi",
    latitude: -1.203,
    longitude: 36.83,
    keywords: ["runda", "muthaiga north"],
    highlights: ["Gated communities", "Diplomatic and executive enclave", "High security"],
    nearby: ["Two Rivers Mall", "Village Market", "UN Gigiri", "Embassies"],
    lifestyle: "Diplomats, C-suite executives, and buyers prioritising security and exclusivity.",
  },
  {
    id: "parklands",
    label: "Parklands",
    city: "Nairobi",
    latitude: -1.263,
    longitude: 36.82,
    keywords: ["parklands", "highridge", "limuru road"],
    highlights: ["Central north Nairobi", "Mixed apartments and townhouses", "Good hospital access"],
    nearby: ["Aga Khan Hospital", "City Park", "Westlands", "CBD"],
    lifestyle: "Families and investors wanting central access with a residential feel.",
  },
  {
    id: "south-b",
    label: "South B",
    city: "Nairobi",
    latitude: -1.313,
    longitude: 36.83,
    keywords: ["south b", "southb", "mombasa road"],
    highlights: ["Affordable apartments", "Airport corridor", "Growing rental market"],
    nearby: ["Nyayo Stadium", "JKIA access road", "T-Mall", "CBD"],
    lifestyle: "First-time buyers and landlords targeting value and connectivity.",
  },
  {
    id: "kileleshwa",
    label: "Kileleshwa",
    city: "Nairobi",
    latitude: -1.283,
    longitude: 36.787,
    keywords: ["kileleshwa", "mandera road"],
    highlights: ["Quiet mid-market residential", "Strong apartment stock", "CBD proximity"],
    nearby: ["Yaya Centre", "Adams Arcade", "Nairobi Hospital"],
    lifestyle: "Young professionals and small families balancing budget and location.",
  },
  {
    id: "muthaiga",
    label: "Muthaiga",
    city: "Nairobi",
    latitude: -1.244,
    longitude: 36.84,
    keywords: ["muthaiga", "thika road"],
    highlights: ["Old-money addresses", "Large standalone homes", "Ultra-prime"],
    nearby: ["Village Market", "UN Gigiri", "Schools and clubs"],
    lifestyle: "Legacy wealth, ambassadors, and buyers seeking Kenya's most exclusive suburbs.",
  },
  {
    id: "diani",
    label: "Diani",
    city: "Kwale",
    latitude: -4.3224,
    longitude: 39.589,
    keywords: ["diani", "ukunda", "south coast"],
    highlights: ["Beach lifestyle", "Holiday homes and short lets", "Tourism-driven demand"],
    nearby: ["Diani Beach", "Ukunda airstrip", "Shopping centres", "Water sports"],
    lifestyle: "Holiday homeowners, retirees, and investors in coastal short-stay rentals.",
  },
  {
    id: "nyali",
    label: "Nyali",
    city: "Mombasa",
    latitude: -4.028,
    longitude: 39.718,
    keywords: ["nyali", "mombasa north"],
    highlights: ["Coastal premium", "Beach proximity", "Strong expat community"],
    nearby: ["Nyali Centre", "City Mall", "Mombasa Marine Park", "Beaches"],
    lifestyle: "Coastal living with malls, beaches, and international schools nearby.",
  },
  {
    id: "kisumu",
    label: "Kisumu",
    city: "Kisumu",
    latitude: -0.0917,
    longitude: 34.768,
    keywords: ["kisumu", "milimani", "riedel"],
    highlights: ["Western Kenya hub", "Lake Victoria lifestyle", "Growing middle class"],
    nearby: ["Kisumu CBD", "Impala Sanctuary", "Lakefront"],
    lifestyle: "Regional investors and families anchored in western Kenya.",
  },
];

export function findKenyaArea(text: string | null | undefined): KenyaArea | null {
  if (!text) return null;
  const hay = text.toLowerCase();
  return (
    KENYA_BROWSE_LOCATIONS.find(
      (area) =>
        hay.includes(area.label.toLowerCase()) ||
        area.keywords.some((kw) => hay.includes(kw)),
    ) ?? null
  );
}

export function areaContextForProperty(parts: {
  title?: string | null;
  address?: string | null;
  city?: string | null;
  description?: string | null;
}): KenyaArea | null {
  const combined = [parts.title, parts.address, parts.city, parts.description].filter(Boolean).join(" ");
  return findKenyaArea(combined) ?? findKenyaArea(parts.city);
}

export function formatAreaBrief(area: KenyaArea): string {
  return [
    `${area.label}, ${area.city}`,
    `Lifestyle: ${area.lifestyle}`,
    `Nearby: ${area.nearby.join(", ")}`,
    `Area strengths: ${area.highlights.join("; ")}`,
  ].join("\n");
}

export function kenyaLocationKnowledgeBlock(): string {
  return KENYA_BROWSE_LOCATIONS.map((a) => formatAreaBrief(a)).join("\n\n");
}

/** Offline map placement from neighbourhood/city when Google Geocoding is unavailable */
export function getStaticMapCoordinates(property: {
  id: string;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}): { latitude: number; longitude: number } | null {
  const area = areaContextForProperty(property);
  if (area) return { latitude: area.latitude, longitude: area.longitude };

  const cityKey = property.city?.trim().toLowerCase();
  if (cityKey && KENYA_CITY_CENTERS[cityKey]) {
    return KENYA_CITY_CENTERS[cityKey];
  }

  const countryKey = property.country?.trim().toLowerCase();
  if (countryKey === "kenya" || !countryKey) {
    return KENYA_CITY_CENTERS.nairobi;
  }

  return null;
}
