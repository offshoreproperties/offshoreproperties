import { z } from "zod";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { PropertyFormValues } from "@/components/admin/property-form";

/** Serializable property form snapshot (stored in Supabase JSONB). */
export const PropertyDraftPayloadSchema = z.object({
  propertyId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  slug: z.string().max(120).optional(),
  property_type: z.string().max(40).optional(),
  listing_type: z.string().max(40).optional(),
  status: z.string().max(40).optional(),
  price: z.string().max(40).optional(),
  currency: z.string().max(3).optional(),
  bedrooms: z.string().max(20).optional(),
  bathrooms: z.string().max(20).optional(),
  area_sqm: z.string().max(40).optional(),
  plot_size_sqm: z.string().max(40).optional(),
  year_built: z.string().max(20).optional(),
  furnishing: z.string().max(40).optional(),
  parking_spaces: z.string().max(20).optional(),
  short_let_min_nights: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  lat: z.string().max(40).optional(),
  lng: z.string().max(40).optional(),
  description: z.string().max(8000).optional(),
  features: z.array(z.string().max(60)).max(50).optional(),
  images: z.array(z.string().max(2000)).max(40).optional(),
  hero_image: z.string().max(2000).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  listing_badges: z.array(z.string().max(40)).max(3).optional(),
  agent_id: z.string().max(40).optional(),
  available_from: z.string().max(20).optional(),
  maps_link: z.string().max(500).optional(),
});

export type PropertyDraftPayload = z.infer<typeof PropertyDraftPayloadSchema>;

export type PropertyDraftRow = {
  id: string;
  property_id: string | null;
  label: string;
  payload: PropertyDraftPayload;
  created_at: string;
  updated_at: string;
};

export type PropertyFormDraftSnapshot = {
  propertyId?: string;
  title: string;
  slug: string;
  property_type: string;
  listing_type: string;
  status: string;
  price: string;
  currency: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  plotSizeSqm: string;
  yearBuilt: string;
  furnishing: string;
  parkingSpaces: string;
  shortLetMinNights: string;
  address: string;
  city: string;
  country: string;
  lat: string;
  lng: string;
  description: string;
  features: string[];
  images: string[];
  heroImage: string;
  isPublished: boolean;
  isFeatured: boolean;
  listingBadges: string[];
  agentId: string;
  availableFrom: string;
  mapsLink: string;
};

export function snapshotToDraftPayload(snapshot: PropertyFormDraftSnapshot): PropertyDraftPayload {
  return PropertyDraftPayloadSchema.parse({
    propertyId: snapshot.propertyId,
    title: snapshot.title,
    slug: snapshot.slug,
    property_type: snapshot.property_type,
    listing_type: snapshot.listing_type,
    status: snapshot.status,
    price: snapshot.price,
    currency: snapshot.currency,
    bedrooms: snapshot.bedrooms,
    bathrooms: snapshot.bathrooms,
    area_sqm: snapshot.areaSqm,
    plot_size_sqm: snapshot.plotSizeSqm,
    year_built: snapshot.yearBuilt,
    furnishing: snapshot.furnishing,
    parking_spaces: snapshot.parkingSpaces,
    short_let_min_nights: snapshot.shortLetMinNights,
    address: snapshot.address,
    city: snapshot.city,
    country: snapshot.country,
    lat: snapshot.lat,
    lng: snapshot.lng,
    description: snapshot.description,
    features: snapshot.features,
    images: snapshot.images,
    hero_image: snapshot.heroImage,
    is_published: snapshot.isPublished,
    is_featured: snapshot.isFeatured,
    listing_badges: snapshot.listingBadges,
    agent_id: snapshot.agentId,
    available_from: snapshot.availableFrom,
    maps_link: snapshot.mapsLink,
  });
}

export function draftPayloadToFormInitial(payload: PropertyDraftPayload): Partial<PropertyFormValues> & {
  furnishing?: string;
  mapsLink?: string;
  lat?: string;
  lng?: string;
  areaSqm?: string;
  plotSizeSqm?: string;
} {
  return {
    id: payload.propertyId,
    title: payload.title ?? "",
    slug: payload.slug ?? "",
    property_type: payload.property_type ?? "villa",
    listing_type: payload.listing_type ?? "sale",
    status: payload.status ?? "available",
    price: payload.price ? Number(payload.price) : 0,
    currency: payload.currency ?? DEFAULT_CURRENCY,
    bedrooms: payload.bedrooms ? Number(payload.bedrooms) : null,
    bathrooms: payload.bathrooms ? Number(payload.bathrooms) : null,
    area_sqm: payload.area_sqm ? Number(payload.area_sqm) : null,
    plot_size_sqm: payload.plot_size_sqm ? Number(payload.plot_size_sqm) : null,
    year_built: payload.year_built ? Number(payload.year_built) : null,
    furnishing_status: payload.furnishing && payload.furnishing !== "__none" ? payload.furnishing : null,
    parking_spaces: payload.parking_spaces ? Number(payload.parking_spaces) : null,
    short_let_min_nights: payload.short_let_min_nights ? Number(payload.short_let_min_nights) : null,
    address: payload.address ?? null,
    city: payload.city ?? null,
    country: payload.country ?? null,
    latitude: payload.lat ? Number(payload.lat) : null,
    longitude: payload.lng ? Number(payload.lng) : null,
    description: payload.description ?? null,
    features: payload.features ?? [],
    images: payload.images ?? [],
    hero_image: payload.hero_image ?? null,
    is_published: payload.is_published ?? false,
    is_featured: payload.is_featured ?? false,
    listing_badges: payload.listing_badges ?? [],
    agent_id: payload.agent_id && payload.agent_id !== "__none" ? payload.agent_id : null,
    available_from: payload.available_from ?? null,
    furnishing: payload.furnishing ?? "__none",
    mapsLink: payload.maps_link ?? "",
    lat: payload.lat ?? "",
    lng: payload.lng ?? "",
    areaSqm: payload.area_sqm ?? "",
    plotSizeSqm: payload.plot_size_sqm ?? "",
  };
}

export function draftLabelFromPayload(payload: PropertyDraftPayload): string {
  const title = payload.title?.trim();
  if (title) return title;
  const city = payload.city?.trim();
  if (city) return `Draft in ${city}`;
  return "Untitled draft";
}

export function hasDraftContent(payload: PropertyDraftPayload): boolean {
  return Boolean(
    payload.title?.trim() ||
      payload.description?.trim() ||
      payload.images?.length ||
      payload.address?.trim() ||
      payload.city?.trim() ||
      payload.price?.trim(),
  );
}
