export const SITE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "")) ||
  "https://offshoreproperties.co.ke";

export const BRAND = {
  name: "Offshore Properties",
  tagline: "Kenya property market, explained properly — by people who know the market.",
  email: "info@offshoreproperties.co.ke",
  phone: "+254 702 447 447",
  phone2: "+254 781 310 331",
  whatsapp: "+254702447447",
  whatsapp2: "+254781310331",
  logoSrc: "/offshore-logo.png",
  ogImageSrc: "/og-image.jpg",
} as const;

export function brandOgImageUrl(origin?: string): string {
  const base = origin?.replace(/\/$/, "") || SITE_URL;
  return `${base}${BRAND.ogImageSrc}`;
}

/** Default listing currency for Kenya */
export const DEFAULT_CURRENCY = "KES" as const;

export const KES_PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "KES 100,000", value: "100000" },
  { label: "KES 200,000", value: "200000" },
  { label: "KES 500,000", value: "500000" },
  { label: "KES 1,000,000", value: "1000000" },
  { label: "KES 5,000,000", value: "5000000" },
  { label: "KES 10,000,000", value: "10000000" },
  { label: "KES 25,000,000", value: "25000000" },
  { label: "KES 50,000,000", value: "50000000" },
  { label: "KES 100,000,000", value: "100000000" },
] as const;

/** Monthly rent budgets for rental / short-let searches */
export const KES_RENT_PRICE_OPTIONS = [
  { label: "Any budget", value: "" },
  { label: "Up to KES 50k / mo", value: "50000" },
  { label: "Up to KES 80k / mo", value: "80000" },
  { label: "Up to KES 120k / mo", value: "120000" },
  { label: "Up to KES 200k / mo", value: "200000" },
  { label: "Up to KES 350k / mo", value: "350000" },
  { label: "Up to KES 500k / mo", value: "500000" },
  { label: "Up to KES 1M / mo", value: "1000000" },
] as const;

/**
 * Homepage hero slideshow — ONLY files listed in kenya-gallery.allowlist.json
 * that exist under public/kenya/ appear on the homepage.
 * Run: npm run sync:gallery
 */
export { KENYA_GALLERY_IMAGES } from "@/lib/kenya-gallery.generated";
export { getKenyaGallerySlides } from "@/lib/kenya-gallery";

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
