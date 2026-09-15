export const LISTING_TYPE_VALUES = ["sale", "rent", "short_let"] as const;
export type ListingTypeValue = (typeof LISTING_TYPE_VALUES)[number];

/** Stored when a listing is available for both sale and rent. */
export const SALE_AND_RENT = "sale_and_rent";

const ALLOWED = new Set<string>(LISTING_TYPE_VALUES);

export function isListingTypeValue(value: string): value is ListingTypeValue {
  return ALLOWED.has(value);
}

/** Expand stored listing_type / listing_types into concrete modes. */
export function normalizeListingTypes(
  types: string[] | null | undefined,
  fallback: string = "sale",
): ListingTypeValue[] {
  const raw = [...(types ?? [])];
  if (fallback === SALE_AND_RENT) raw.push("sale", "rent");
  if (fallback === "sale" || fallback === "rent" || fallback === "short_let") raw.push(fallback);

  const cleaned = [
    ...new Set(
      raw.flatMap((t) => {
        if (t === SALE_AND_RENT) return ["sale", "rent"] as ListingTypeValue[];
        if (isListingTypeValue(t)) return [t];
        return [];
      }),
    ),
  ];
  if (cleaned.length) return cleaned;
  return ["sale"];
}

/** Prefer sale for dual listings so the main price reads as purchase price. */
export function primaryListingType(types: string[] | null | undefined, fallback = "sale"): ListingTypeValue {
  const normalized = normalizeListingTypes(types, fallback);
  if (normalized.includes("sale")) return "sale";
  if (normalized.includes("rent")) return "rent";
  if (normalized.includes("short_let")) return "short_let";
  return "sale";
}

/** Persist dual sale+rent as a single text value (no DB migration required). */
export function serializeListingType(types: string[]): string {
  const normalized = normalizeListingTypes(types);
  const hasSale = normalized.includes("sale");
  const hasRent = normalized.includes("rent");
  const hasShort = normalized.includes("short_let");
  if (hasSale && (hasRent || hasShort) && !hasShort) return SALE_AND_RENT;
  if (hasSale && hasRent) return SALE_AND_RENT;
  if (hasSale) return "sale";
  if (hasRent) return "rent";
  if (hasShort) return "short_let";
  return "sale";
}

export function propertyListingTypes(p: {
  listing_type?: string | null;
  listing_types?: string[] | null;
}): ListingTypeValue[] {
  if (p.listing_types?.length) return normalizeListingTypes(p.listing_types, p.listing_type ?? "sale");
  return normalizeListingTypes(
    p.listing_type === SALE_AND_RENT ? ["sale", "rent"] : p.listing_type ? [p.listing_type] : [],
    p.listing_type ?? "sale",
  );
}

export function matchesListingFilter(
  types: string[] | null | undefined,
  filter?: string | null,
  fallbackType = "sale",
): boolean {
  if (!filter || filter === "any") return true;
  const normalized = normalizeListingTypes(types, fallbackType);
  if (filter === "rent") return normalized.includes("rent") || normalized.includes("short_let");
  if (filter === "sale") return normalized.includes("sale");
  if (filter === "short_let") return normalized.includes("short_let");
  if (filter === SALE_AND_RENT) return normalized.includes("sale") && normalized.includes("rent");
  return normalized.includes(filter as ListingTypeValue);
}

export function listingTypesShortLabel(types: string[] | null | undefined, fallback = "sale"): string {
  const normalized = normalizeListingTypes(types, fallback);
  return normalized
    .map((t) => (t === "sale" ? "Sale" : t === "rent" ? "Rent" : "Short let"))
    .join(" · ");
}
