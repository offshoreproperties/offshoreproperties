import { BRAND } from "@/lib/constants";
import { formatPrice, listingTypeShort, propertyTypeLabel } from "@/lib/format";

/**
 * Strips everything except digits and a leading '+' so we get a clean
 * international number for the wa.me link.
 */
function cleanNumber(raw: string): string {
  const stripped = raw.replace(/[^+\d]/g, "");
  return stripped.startsWith("+") ? stripped.slice(1) : stripped;
}

/**
 * Build a WhatsApp click-to-chat URL.
 * Falls back to BRAND.whatsapp if no agent number is provided.
 * `lines` is an array of message lines — nulls are filtered out.
 */
export function buildWhatsAppUrl(
  agentNumber: string | null | undefined,
  lines: (string | null | undefined)[],
): string {
  const number = cleanNumber(agentNumber || BRAND.whatsapp);
  const text = lines.filter((l): l is string => l != null).join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export type PropertyWhatsAppContext = {
  title: string;
  slug?: string | null;
  price?: number;
  currency?: string;
  listingType?: string;
  propertyType?: string;
  city?: string | null;
  country?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  address?: string | null;
};

function propertyPageUrl(slug?: string | null): string | null {
  if (!slug) return null;
  const base =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return `/properties/${slug}`;
  return `${String(base).replace(/\/$/, "")}/properties/${slug}`;
}

export function buildPropertyInterestLines(ctx: PropertyWhatsAppContext): string[] {
  const location = [ctx.city, ctx.country].filter(Boolean).join(", ");
  const specs = [
    ctx.bedrooms != null ? `${ctx.bedrooms} bed` : null,
    ctx.bathrooms != null ? `${ctx.bathrooms} bath` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const link = propertyPageUrl(ctx.slug);

  return [
    `Hello! I'm interested in this property on ${BRAND.name}.`,
    "",
    `*Property:* ${ctx.title}`,
    ctx.propertyType && ctx.listingType
      ? `*Type:* ${propertyTypeLabel(ctx.propertyType)} · ${listingTypeShort(ctx.listingType)}`
      : null,
    ctx.price != null && ctx.currency
      ? `*Price:* ${formatPrice(ctx.price, ctx.currency, ctx.listingType ?? "sale")}`
      : null,
    location ? `*Location:* ${location}` : null,
    ctx.address ? `*Address:* ${ctx.address}` : null,
    specs ? `*Details:* ${specs}` : null,
    link ? `*Link:* ${link}` : null,
    "",
    "I'd like more information please. Thank you!",
  ];
}

export function buildPropertyEnquiryLines(
  ctx: PropertyWhatsAppContext,
  contact: {
    name: string;
    email: string;
    phone?: string | null;
    message?: string | null;
  },
): string[] {
  return [
    ...buildPropertyInterestLines(ctx).slice(0, -2),
    "",
    "--- *My details* ---",
    `*Name:* ${contact.name}`,
    `*Email:* ${contact.email}`,
    contact.phone ? `*Phone:* ${contact.phone}` : null,
    contact.message ? `\n*What I'm looking for:*\n${contact.message}` : null,
    "",
    "Looking forward to hearing from you!",
  ];
}

export function buildGeneralEnquiryLines(contact: {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
}): string[] {
  return [
    `Hello, I'd like to enquire via ${BRAND.name}.`,
    "",
    `*Name:* ${contact.name}`,
    `*Email:* ${contact.email}`,
    contact.phone ? `*Phone:* ${contact.phone}` : null,
    contact.message ? `\n*Message:*\n${contact.message}` : null,
    "",
    "Looking forward to hearing from you!",
  ];
}

export function buildPropertyViewingLines(
  ctx: PropertyWhatsAppContext,
  contact: {
    name: string;
    email: string;
    phone?: string | null;
    date: string;
    time: string;
    notes?: string | null;
  },
): string[] {
  return [
    ...buildPropertyInterestLines(ctx).slice(0, -2),
    "",
    `*Preferred viewing:* ${contact.date} at ${contact.time}`,
    "",
    "--- *My details* ---",
    `*Name:* ${contact.name}`,
    `*Email:* ${contact.email}`,
    contact.phone ? `*Phone:* ${contact.phone}` : null,
    contact.notes ? `\n*Notes:*\n${contact.notes}` : null,
    "",
    "Please confirm the viewing at your earliest convenience. Thank you!",
  ];
}

export function propertyWhatsAppUrl(
  whatsapp: string | null | undefined,
  ctx: PropertyWhatsAppContext,
): string {
  return buildWhatsAppUrl(whatsapp, buildPropertyInterestLines(ctx));
}
