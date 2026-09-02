import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";
import type { MapProperty } from "@/components/properties-map";

export function MapListingsFallback({ properties }: { properties: MapProperty[] }) {
  if (!properties.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium text-neutral-900">{properties.length} listings with map locations</p>
      <p className="mt-1 text-xs text-neutral-500">
        Map tiles unavailable — browse listings below until Google Maps APIs are enabled.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {properties.map((p) => (
          <Link
            key={p.id}
            to="/properties/$slug"
            params={{ slug: p.slug ?? p.id }}
            className="flex gap-3 rounded-lg border border-neutral-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
          >
            {p.hero_image ? (
              <img src={p.hero_image} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
                —
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{p.title}</p>
              <p className="text-sm text-blue-600">{formatPrice(Number(p.price), p.currency, p.listing_type)}</p>
              {p.city ? <p className="text-xs text-neutral-500">{p.city}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
