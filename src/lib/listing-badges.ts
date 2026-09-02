export type ListingBadgeId =
  | "hot_deal"
  | "hot_listing"
  | "best_deal"
  | "new_listing"
  | "price_reduced"
  | "exclusive"
  | "open_house"
  | "under_offer"
  | "just_sold"
  | "sold"
  | "rented"
  | "renting_fast"
  | "limited_offer"
  | "investor_pick";

export type ListingBadgeDef = {
  id: ListingBadgeId;
  label: string;
  description: string;
  className: string;
};

/** Admin-selectable marketing badges shown on cards and property pages. */
export const LISTING_BADGE_OPTIONS: readonly ListingBadgeDef[] = [
  {
    id: "hot_deal",
    label: "Hot deal",
    description: "High-demand listing at a strong price",
    className: "bg-rose-600 text-white",
  },
  {
    id: "hot_listing",
    label: "Hot listing",
    description: "Trending property getting lots of interest",
    className: "bg-orange-500 text-white",
  },
  {
    id: "best_deal",
    label: "Best deal",
    description: "Standout value in its category",
    className: "bg-emerald-600 text-white",
  },
  {
    id: "new_listing",
    label: "New listing",
    description: "Recently added to the collection",
    className: "bg-blue-600 text-white",
  },
  {
    id: "price_reduced",
    label: "Price reduced",
    description: "Recently lowered asking price",
    className: "bg-violet-600 text-white",
  },
  {
    id: "exclusive",
    label: "Exclusive",
    description: "Only available through Offshore",
    className: "bg-amber-500 text-black",
  },
  {
    id: "open_house",
    label: "Open house",
    description: "Viewings or open day scheduled",
    className: "bg-teal-600 text-white",
  },
  {
    id: "under_offer",
    label: "Under offer",
    description: "Offer received — act quickly",
    className: "bg-amber-100 text-amber-950 ring-1 ring-amber-300",
  },
  {
    id: "just_sold",
    label: "Just sold",
    description: "Recently completed sale",
    className: "bg-neutral-800 text-white",
  },
  {
    id: "sold",
    label: "Sold",
    description: "No longer available for sale",
    className: "bg-neutral-200 text-neutral-800",
  },
  {
    id: "rented",
    label: "Rented",
    description: "No longer available for rent",
    className: "bg-neutral-200 text-neutral-800",
  },
  {
    id: "renting_fast",
    label: "Renting fast",
    description: "High rental demand",
    className: "bg-cyan-600 text-white",
  },
  {
    id: "limited_offer",
    label: "Limited offer",
    description: "Short-term promotion or incentive",
    className: "bg-fuchsia-600 text-white",
  },
  {
    id: "investor_pick",
    label: "Investor pick",
    description: "Strong investment potential",
    className: "bg-indigo-600 text-white",
  },
] as const;

const BADGE_MAP = new Map(LISTING_BADGE_OPTIONS.map((b) => [b.id, b]));

export function getListingBadge(id: string): ListingBadgeDef | undefined {
  return BADGE_MAP.get(id as ListingBadgeId);
}

export function listingBadgeLabel(id: string): string {
  return getListingBadge(id)?.label ?? id.replace(/_/g, " ");
}

export function listingBadgeClassName(id: string): string {
  return getListingBadge(id)?.className ?? "bg-neutral-800 text-white";
}

export function normalizeListingBadges(badges: string[] | null | undefined): ListingBadgeId[] {
  const valid = new Set(LISTING_BADGE_OPTIONS.map((b) => b.id));
  return (badges ?? []).filter((b): b is ListingBadgeId => valid.has(b as ListingBadgeId));
}

export const MAX_LISTING_BADGES = 3;
