import type { LucideIcon } from "lucide-react";
import {
  Bath,
  Car,
  Dumbbell,
  Fence,
  Flame,
  Home,
  Landmark,
  Leaf,
  MapPin,
  Shield,
  Sparkles,
  Sun,
  Trees,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";

export type AmenityCategoryId =
  | "outdoor"
  | "interior"
  | "kitchen"
  | "bathroom"
  | "parking"
  | "security"
  | "views"
  | "connectivity"
  | "furnishing"
  | "land"
  | "other";

export type AmenityCategory = {
  id: AmenityCategoryId;
  label: string;
  icon: LucideIcon;
  items: readonly string[];
};

export const AMENITY_CATEGORIES: readonly AmenityCategory[] = [
  {
    id: "outdoor",
    label: "Outdoor & recreation",
    icon: Trees,
    items: [
      "Swimming pool",
      "Private garden",
      "Landscaped garden",
      "Rooftop terrace",
      "Balcony",
      "BBQ area",
      "Children's play area",
      "Tennis court",
      "Basketball court",
      "Jogging track",
      "Outdoor gym",
      "Courtyard",
      "Patio",
      "Deck",
    ],
  },
  {
    id: "interior",
    label: "Interior & comfort",
    icon: Home,
    items: [
      "Air conditioning",
      "Ceiling fans",
      "Central heating",
      "Fireplace",
      "High ceilings",
      "Walk-in closet",
      "Study room",
      "Home office",
      "Laundry room",
      "Store room",
      "Open-plan living",
      "Double glazing",
      "Wooden floors",
      "Marble floors",
      "Built-in wardrobes",
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen & dining",
    icon: UtensilsCrossed,
    items: [
      "Fitted kitchen",
      "Open-plan kitchen",
      "Kitchen island",
      "Pantry",
      "Dining room",
      "Breakfast nook",
      "Gas cooker",
      "Electric oven",
      "Extractor fan",
      "Wine cellar",
    ],
  },
  {
    id: "bathroom",
    label: "Bathrooms & wellness",
    icon: Bath,
    items: [
      "En-suite bathroom",
      "Guest bathroom",
      "Jacuzzi",
      "Sauna",
      "Steam room",
      "Rain shower",
      "Bathtub",
      "His & hers sinks",
    ],
  },
  {
    id: "parking",
    label: "Parking & access",
    icon: Car,
    items: [
      "Covered parking",
      "Garage",
      "Driveway",
      "Visitor parking",
      "Electric vehicle charging",
      "Wheelchair access",
      "Lift / elevator",
      "Wide driveway",
    ],
  },
  {
    id: "security",
    label: "Security & utilities",
    icon: Shield,
    items: [
      "24/7 security",
      "CCTV",
      "Electric fence",
      "Gated community",
      "Concierge",
      "Backup generator",
      "Solar power",
      "Borehole water",
      "Water storage tank",
      "Mains water",
      "Mains electricity",
      "Alarm system",
      "Intercom entry",
    ],
  },
  {
    id: "views",
    label: "Views & location",
    icon: MapPin,
    items: [
      "Sea view",
      "Ocean view",
      "City view",
      "Garden view",
      "Golf course view",
      "Lake view",
      "Mountain view",
      "Park view",
      "Near beach",
      "Near school",
      "Near shopping mall",
      "Near hospital",
      "Near main road",
      "Quiet neighbourhood",
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity & tech",
    icon: Wifi,
    items: [
      "Fibre internet",
      "High-speed Wi-Fi",
      "Smart home",
      "DSTV / satellite TV",
      "Cable TV",
      "Video intercom",
    ],
  },
  {
    id: "furnishing",
    label: "Furnishing & staff",
    icon: Sparkles,
    items: [
      "Fully furnished",
      "Semi-furnished",
      "Unfurnished",
      "Servant's quarter (SQ)",
      "Staff quarters",
      "Guest wing",
      "Pet friendly",
    ],
  },
  {
    id: "land",
    label: "Land & development",
    icon: Landmark,
    items: [
      "Serviced plot",
      "Title deed ready",
      "Perimeter wall",
      "Borehole on site",
      "Graded road access",
      "Subdividable",
      "Corner plot",
      "Flat terrain",
      "Sloped terrain",
      "Agricultural land",
      "Commercial zoning",
      "Residential zoning",
    ],
  },
] as const;

/** Flat list of every preset amenity label */
export const ALL_PRESET_AMENITIES = AMENITY_CATEGORIES.flatMap((c) => c.items);

const CATEGORY_BY_LABEL = new Map<string, AmenityCategoryId>(
  AMENITY_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => [normalizeAmenityKey(item), cat.id]),
  ),
);

const ICON_BY_CATEGORY: Record<AmenityCategoryId, LucideIcon> = {
  outdoor: Sun,
  interior: Wind,
  kitchen: UtensilsCrossed,
  bathroom: Bath,
  parking: Car,
  security: Shield,
  views: Waves,
  connectivity: Wifi,
  furnishing: Sparkles,
  land: Fence,
  other: Leaf,
};

export function normalizeAmenityKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getAmenityCategoryId(feature: string): AmenityCategoryId {
  return CATEGORY_BY_LABEL.get(normalizeAmenityKey(feature)) ?? "other";
}

export function getCategoryMeta(id: AmenityCategoryId): AmenityCategory | undefined {
  return AMENITY_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryIcon(id: AmenityCategoryId): LucideIcon {
  return ICON_BY_CATEGORY[id];
}

export type GroupedAmenities = {
  id: AmenityCategoryId;
  label: string;
  icon: LucideIcon;
  items: string[];
};

/** Group features by category; unknown/custom items land in "Other". */
export function groupAmenities(features: string[]): GroupedAmenities[] {
  const buckets = new Map<AmenityCategoryId, string[]>();

  for (const raw of features) {
    const feature = raw.trim();
    if (!feature) continue;
    const cat = getAmenityCategoryId(feature);
    const list = buckets.get(cat) ?? [];
    if (!list.includes(feature)) list.push(feature);
    buckets.set(cat, list);
  }

  const ordered: AmenityCategoryId[] = [
    "outdoor",
    "interior",
    "kitchen",
    "bathroom",
    "parking",
    "security",
    "views",
    "connectivity",
    "furnishing",
    "land",
    "other",
  ];

  return ordered
    .filter((id) => buckets.has(id))
    .map((id) => {
      const meta = getCategoryMeta(id);
      return {
        id,
        label: id === "other" ? "Other features" : (meta?.label ?? "Features"),
        icon: getCategoryIcon(id),
        items: buckets.get(id) ?? [],
      };
    });
}

export function sortAmenities(features: string[]): string[] {
  const order = new Map(ALL_PRESET_AMENITIES.map((item, i) => [normalizeAmenityKey(item), i]));
  return [...features].sort((a, b) => {
    const ai = order.get(normalizeAmenityKey(a)) ?? 9999;
    const bi = order.get(normalizeAmenityKey(b)) ?? 9999;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
}
