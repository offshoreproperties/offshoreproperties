import { BRAND, brandOgImageUrl } from "@/lib/constants";
import {
  formatPrice,
  listingTypeShort,
  propertyLocationLine,
  propertyTypeLabel,
} from "@/lib/format";

const DEFAULT_OG_IMAGE = brandOgImageUrl();

export type PropertyOgInput = {
  title: string;
  slug?: string | null;
  price: number;
  currency: string;
  listing_type: string;
  property_type: string;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  description?: string | null;
  hero_image?: string | null;
  images?: string[] | null;
};

export function siteBaseUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://offshoreproperties.co.ke";
}

export function propertyShareUrl(slug: string): string {
  return `${siteBaseUrl()}/properties/${encodeURIComponent(slug)}`;
}

export function propertyOgImage(property: PropertyOgInput): string {
  const candidates = [property.hero_image, ...(property.images ?? [])].filter(Boolean) as string[];
  for (const url of candidates) {
    if (url.startsWith("https://")) return url;
    if (url.startsWith("http://")) return url;
    if (url.startsWith("/")) return `${siteBaseUrl()}${url}`;
  }
  return DEFAULT_OG_IMAGE;
}

export function propertyOgDescription(property: PropertyOgInput): string {
  const price = formatPrice(property.price, property.currency, property.listing_type);
  const location = propertyLocationLine({
    city: property.city,
    country: property.country,
    address: property.address,
  });
  const type = `${propertyTypeLabel(property.property_type)} · ${listingTypeShort(property.listing_type)}`;
  const specs = [
    property.bedrooms != null ? `${property.bedrooms} bed` : null,
    property.bathrooms != null ? `${property.bathrooms} bath` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const parts = [price, type, location, specs].filter(Boolean);
  const summary = parts.join(" · ");
  const excerpt = property.description?.trim().slice(0, 120);
  return excerpt ? `${summary} — ${excerpt}${excerpt.length >= 120 ? "…" : ""}` : summary;
}

export function buildPropertyHead(property: PropertyOgInput, routeSlug: string) {
  const slug = property.slug ?? routeSlug;
  const url = propertyShareUrl(slug);
  const title = `${property.title} | ${BRAND.name}`;
  const description = propertyOgDescription(property);
  const image = propertyOgImage(property);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: BRAND.name },
      { property: "og:title", content: property.title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: property.title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: property.title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export { DEFAULT_OG_IMAGE };
