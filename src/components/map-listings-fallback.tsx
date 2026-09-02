import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";
import type { MapProperty } from "@/components/properties-map";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export function MapListingsFallback({
  properties,
  className,
}: {
  properties: MapProperty[];
  className?: string;
}) {
  if (!properties.length) return null;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <MapPin className="h-4 w-4 text-blue-600" />
          {properties.length} {properties.length === 1 ? "listing" : "listings"} on the map
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Browse by card until the live map is connected — prices and areas are still accurate.
        </p>
      </div>
      <div className="scrollbar-offshore max-h-[min(52dvh,480px)] overflow-y-auto p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {properties.map((p) => (
            <Link
              key={p.id}
              to="/properties/$slug"
              params={{ slug: p.slug ?? p.id }}
              className="flex gap-3 rounded-xl border border-neutral-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              {p.hero_image ? (
                <img src={p.hero_image} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
                  —
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{p.title}</p>
                <p className="text-sm font-semibold text-blue-600">
                  {formatPrice(Number(p.price), p.currency, p.listing_type)}
                </p>
                {p.city ? <p className="text-xs text-neutral-500">{p.city}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
