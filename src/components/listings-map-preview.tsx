import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Navigation } from "lucide-react";
import { formatPrice, formatPriceCompact } from "@/lib/format";
import type { MapProperty } from "@/components/properties-map";
import { buildStaticMapImageUrl, getClientGoogleMapsApiKey } from "@/lib/google-maps";
import { googleMapsDirectionsUrl, openExternalMaps } from "@/lib/maps-url";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ListingsMapPreview({
  properties,
  className,
  showPricePins = true,
}: {
  properties: MapProperty[];
  className?: string;
  showPricePins?: boolean;
}) {
  const [apiKey, setApiKey] = useState<string | undefined>();
  const [staticFailed, setStaticFailed] = useState(false);

  useEffect(() => {
    setApiKey(getClientGoogleMapsApiKey());
  }, []);

  const withCoords = properties.filter(
    (p) => p.latitude != null && p.longitude != null,
  ) as (MapProperty & { latitude: number; longitude: number })[];

  const staticUrl =
    apiKey && withCoords.length && !staticFailed
      ? buildStaticMapImageUrl(withCoords, apiKey)
      : null;

  if (!withCoords.length) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center",
          className,
        )}
      >
        <MapPin className="mb-3 h-10 w-10 text-slate-400" />
        <p className="font-medium text-slate-900">Listings coming soon</p>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          We&apos;re adding new homes across Nairobi and the coast — check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full min-h-[360px] overflow-hidden rounded-2xl bg-slate-950 shadow-inner ring-1 ring-slate-800/80",
        className,
      )}
    >
      {staticUrl ? (
        <img
          src={staticUrl}
          alt="Map of listing locations in Kenya"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setStaticFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 35%) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/30" />

      <div className="relative flex h-full flex-col justify-end p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-300">
              {withCoords.length} {withCoords.length === 1 ? "listing" : "listings"} plotted
            </p>
            <p className="mt-1 max-w-md text-sm text-white/75">
              Tap a home for details or get directions.
            </p>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/15"
          >
            All listings
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="scrollbar-dark grid max-h-[min(42dvh,320px)] gap-3 overflow-y-auto sm:grid-cols-2">
          {withCoords.map((p) => {
            const approximate = p.locationSource && p.locationSource !== "exact";
            return (
              <div
                key={p.id}
                className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-md"
              >
                {p.hero_image ? (
                  <img
                    src={p.hero_image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {showPricePins ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold text-white",
                          approximate ? "bg-slate-600" : "bg-blue-600",
                        )}
                      >
                        {approximate ? "~" : ""}
                        {formatPriceCompact(Number(p.price), p.currency, p.listing_type)}
                      </span>
                    ) : null}
                    {p.city ? <span className="text-xs text-slate-400">{p.city}</span> : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{p.title}</p>
                  {!showPricePins ? (
                    <p className="text-sm font-medium text-blue-300">
                      {formatPrice(Number(p.price), p.currency, p.listing_type)}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to="/properties/$slug"
                      params={{ slug: p.slug ?? p.id }}
                      className="text-xs font-medium text-blue-300 hover:text-blue-200"
                    >
                      View listing →
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                      onClick={() =>
                        openExternalMaps(
                          googleMapsDirectionsUrl(Number(p.latitude), Number(p.longitude), {
                            label: p.title,
                          }),
                        )
                      }
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
