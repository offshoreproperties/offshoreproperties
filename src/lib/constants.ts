export const BRAND = {
  name: "Offshore Properties",
  tagline: "Real estate made easy and transparent",
  email: "hello@offshoreproperties.com",
  phone: "+254 702 447 447",
  phone2: "+254 781 310 331",
  whatsapp: "+254702447447",
} as const;

/** Default listing currency for Kenya */
export const DEFAULT_CURRENCY = "KES" as const;

export const KES_PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "Kshs 100,000", value: "100000" },
  { label: "Kshs 200,000", value: "200000" },
  { label: "Kshs 500,000", value: "500000" },
  { label: "Kshs 1,000,000", value: "1000000" },
  { label: "Kshs 5,000,000", value: "5000000" },
  { label: "Kshs 10,000,000", value: "10000000" },
  { label: "Kshs 25,000,000", value: "25000000" },
  { label: "Kshs 50,000,000", value: "50000000" },
  { label: "Kshs 100,000,000", value: "100000000" },
] as const;

/**
 * Kenyan hero gallery — high-res landmark photos (GTC, Expressway, UNON,
 * Mt Longonot, golf, tea & flower farms) plus scenic Unsplash slides.
 */
export const KENYA_GALLERY_IMAGES = [
  "/kenya/gtc-tower.jpg",
  "/kenya/nairobi-expressway.png",
  "/kenya/un-complex-nairobi.jpg",
  "/kenya/mt-longonot.jpg",
  "/kenya/mt-longonot-crater.jpg",
  "/kenya/golf-course-nairobi.jpg",
  "/kenya/tea-plantation-kiambu.jpg",
  "/kenya/tea-farm-kenya.jpg",
  "/kenya/rose-greenhouse.jpg",
  "/kenya/flower-farm-roses.jpg",
  "https://images.unsplash.com/photo-1741991110666-88115e724741?auto=format&fit=crop&w=2400&q=92",
  "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=2400&q=92",
  "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=2400&q=92",
  "https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=2400&q=92",
] as const;

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85";

/** Havenly-style homepage — modern angular architecture */
export const HAVENLY_HERO_IMAGE =
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1920&q=85";

export const HAVENLY_HERO_SALE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85";

export const HAVENLY_HERO_RENT =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=85";

export const NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/properties", label: "Collection" },
  { to: "/map", label: "Map" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export const PROPERTY_TYPES = [
  { value: "any", label: "All types" },
  { value: "villa", label: "Villas" },
  { value: "apartment", label: "Apartments" },
  { value: "townhouse", label: "Townhouses" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
] as const;

export const LISTING_TYPES = [
  { value: "any", label: "Any" },
  { value: "sale", label: "For sale" },
  { value: "rent", label: "For rent" },
  { value: "short_let", label: "Short let" },
] as const;
