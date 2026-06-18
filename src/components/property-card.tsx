import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Star,
  LandPlot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  formatPrice,
  formatArea,
  propertyTypeLabel,
  statusLabel,
  listingTypeShort,
  propertyLocationLine,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export type PropertyCardData = {
  id: string;
  slug: string | null;
  title: string;
  property_type: string;
  listing_type: string;
  status?: string | null;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  plot_size_sqm?: number | null;
  address?: string | null;
  city: string | null;
  country: string | null;
  description?: string | null;
  features?: string[] | null;
  hero_image: string | null;
  images: string[] | null;
  is_featured?: boolean | null;
};

function allImages(p: PropertyCardData): string[] {
  const imgs: string[] = [];
  if (p.hero_image) imgs.push(p.hero_image);
  if (p.images) {
    for (const u of p.images) {
      if (u && !imgs.includes(u)) imgs.push(u);
    }
  }
  return imgs;
}

function statusTone(status: string) {
  if (status === "available") return "bg-blue-50 text-blue-700";
  if (status === "under_offer") return "bg-amber-100 text-amber-900";
  return "bg-neutral-200 text-neutral-700";
}

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-xs text-black/30">
        No image
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <img src={images[0]} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
    );
  }

  const navBtn =
    "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur transition active:scale-95 sm:opacity-0 sm:group-hover:opacity-100";

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div key={src} className="aspect-[4/3] w-full shrink-0 snap-center bg-neutral-100">
            <img src={src} alt={`${title} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll("left"); }}
        className={cn(navBtn, "left-1.5")}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll("right"); }}
        className={cn(navBtn, "right-1.5")}
        aria-label="Next image"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        {images.map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-sm" />
        ))}
      </div>
    </div>
  );
}

export function PropertyCard({ p }: { p: PropertyCardData }) {
  const location = propertyLocationLine(p);
  const area = formatArea(p.area_sqm, p.property_type);
  const plot = formatArea(p.plot_size_sqm, p.property_type);
  const isLand = p.property_type === "land";
  const features = (p.features ?? []).filter(Boolean).slice(0, 3);
  const extraFeatures = (p.features?.length ?? 0) - features.length;
  const status = p.status ?? "available";
  const imgs = allImages(p);

  type Stat = "bed" | "bath" | "area" | "plot";
  const stats: { kind: Stat; label: string }[] = [];
  if (!isLand && p.bedrooms != null) stats.push({ kind: "bed", label: `${p.bedrooms} bd` });
  if (!isLand && p.bathrooms != null) stats.push({ kind: "bath", label: `${p.bathrooms} ba` });
  if (area) stats.push({ kind: "area", label: area });
  if (plot && plot !== area) stats.push({ kind: "plot", label: plot });

  function StatIcon({ kind }: { kind: Stat }) {
    const cls = "h-3.5 w-3.5";
    if (kind === "bed") return <Bed className={cls} />;
    if (kind === "bath") return <Bath className={cls} />;
    if (kind === "plot") return <LandPlot className={cls} />;
    return <Maximize className={cls} />;
  }

  return (
    <Link
      to="/properties/$slug"
      params={{ slug: p.slug ?? p.id }}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-neutral-300"
    >
      {/* Image carousel */}
      <div className="relative overflow-hidden">
        <ImageCarousel images={imgs} title={p.title} />
        {p.is_featured && (
          <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white">
            <Star className="h-3 w-3 fill-current" aria-hidden />
          </span>
        )}
        {/* Badges overlay */}
        <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1">
          <span className="rounded-md bg-[#0a0a0a]/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur sm:text-[11px]">
            {propertyTypeLabel(p.property_type)}
          </span>
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 sm:text-[11px]">
            {listingTypeShort(p.listing_type)}
          </span>
        </div>
        {status !== "available" && (
          <span
            className={cn(
              "absolute left-2 bottom-2 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur sm:text-[11px]",
              statusTone(status),
            )}
          >
            {statusLabel(status)}
          </span>
        )}
      </div>

      {/* Details below image */}
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-3 sm:px-4 sm:py-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-neutral-900 sm:text-[15px]">
          {p.title}
        </h3>

        {location && (
          <p className="flex items-start gap-1 text-[11px] leading-tight text-neutral-600 sm:text-xs">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" aria-hidden />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <p className="text-base font-extrabold leading-none text-blue-600 sm:text-lg">
            {formatPrice(Number(p.price), p.currency, p.listing_type)}
          </p>
          {stats.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-neutral-700 sm:text-xs">
              {stats.map((s) => (
                <li key={s.label} className="flex items-center gap-0.5 text-blue-500">
                  <StatIcon kind={s.kind} />
                  <span className="text-neutral-600">{s.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {features.length > 0 && (
          <ul className="flex flex-wrap gap-1 pt-0.5">
            {features.map((f) => (
              <li key={f} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 sm:text-[11px]">
                {f}
              </li>
            ))}
            {extraFeatures > 0 && (
              <li className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 sm:text-[11px]">
                +{extraFeatures}
              </li>
            )}
          </ul>
        )}
      </div>
    </Link>
  );
}
