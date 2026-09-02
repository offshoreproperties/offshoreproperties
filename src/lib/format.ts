import { DEFAULT_CURRENCY } from "@/lib/constants";

function formatKesAmount(price: number): string {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(price);
}

export function formatPrice(price: number, currency = DEFAULT_CURRENCY, listingType = "sale") {
  if (currency === "KES") {
    const base = `Kshs ${formatKesAmount(price)}`;
    if (listingType === "rent") return `${base}/mo`;
    if (listingType === "short_let") return `${base}/night`;
    return base;
  }

  const n = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
  if (listingType === "rent") return `${n}/mo`;
  if (listingType === "short_let") return `${n}/night`;
  return n;
}

/** Short price label for map pins */
export function formatPriceCompact(price: number, currency = DEFAULT_CURRENCY, listingType = "sale") {
  const prefix = currency === "KES" ? "Kshs " : currency === "USD" ? "$" : `${currency} `;
  let body: string;
  if (price >= 1_000_000_000) body = `${(price / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  else if (price >= 1_000_000) body = `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  else if (price >= 1_000) body = `${Math.round(price / 1000)}k`;
  else body = String(Math.round(price));

  const suffix = listingType === "rent" ? "/mo" : listingType === "short_let" ? "/nt" : "";
  return `${prefix}${body}${suffix}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function propertyTypeLabel(t: string) {
  return ({
    apartment: "Apartment",
    villa: "Villa",
    land: "Land",
    commercial: "Commercial",
    townhouse: "Townhouse",
  } as Record<string, string>)[t] ?? t;
}

export function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function listingTypeShort(t: string) {
  if (t === "sale") return "Sale";
  if (t === "rent") return "Rent";
  if (t === "short_let") return "Short let";
  return t;
}

const SQM_PER_ACRE = 4046.86;

/** Compact area — shows acres for land, m² for everything else */
export function formatArea(
  sqm: number | null | undefined,
  propertyType?: string | null,
) {
  if (sqm == null || Number.isNaN(Number(sqm))) return null;
  const n = Number(sqm);

  if (propertyType === "land") {
    const acres = n / SQM_PER_ACRE;
    if (acres >= 100) return `${Math.round(acres).toLocaleString()} acres`;
    if (acres >= 10) return `${acres.toFixed(1).replace(/\.0$/, "")} acres`;
    return `${acres.toFixed(2).replace(/\.?0+$/, "")} acres`;
  }

  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M m²`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k m²`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k m²`;
  return `${Math.round(n).toLocaleString()} m²`;
}

export function propertyLocationLine(p: {
  address?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  const cityCountry = [p.city, p.country].filter(Boolean).join(", ");
  if (p.address && cityCountry) return `${p.address} · ${cityCountry}`;
  if (p.address) return p.address;
  return cityCountry || null;
}
