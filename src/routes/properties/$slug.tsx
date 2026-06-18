import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getPropertyBySlug, recordPropertyView } from "@/lib/properties.functions";
import { SiteLayout } from "@/components/site-layout";
import {
  collectPropertyImages,
  PropertyImageGallery,
} from "@/components/property-image-gallery";
import { formatPrice, formatArea, propertyTypeLabel, statusLabel } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Bed, Bath, Maximize, MapPin, ArrowLeft, Map, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/properties/$slug")({
  head: ({ params }) => {
    const readable = params.slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${readable} | ${BRAND.name}` },
        { name: "description", content: `${readable} — ${BRAND.tagline}` },
      ],
    };
  },
  component: PropertyDetailPage,
});

function PropertyContactPanel({
  price,
  currency,
  listingType,
  propertyTitle,
  whatsapp,
  className,
}: {
  price: number;
  currency: string;
  listingType: string;
  propertyTitle: string;
  whatsapp: string | null;
  className?: string;
}) {
  const whatsappUrl = buildWhatsAppUrl(whatsapp, [`Hi, I'm interested in ${propertyTitle}.`]);

  return (
    <div className={className}>
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
        <p className="text-xl font-bold text-blue-600 sm:text-2xl lg:text-2xl xl:text-3xl">
          {formatPrice(price, currency, listingType)}
        </p>
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Contact</p>
          <ul className="space-y-1 text-sm">
            <li>
              <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {BRAND.phone}
              </a>
            </li>
            <li>
              <a href={`tel:${BRAND.phone2.replace(/\s/g, "")}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {BRAND.phone2}
              </a>
            </li>
          </ul>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}

function PropertyDetailPage() {
  const { slug } = Route.useParams();
  const fetch = useServerFn(getPropertyBySlug);
  const track = useServerFn(recordPropertyView);

  const { data: p, isLoading, error } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => fetch({ data: { slug } }),
  });

  useEffect(() => {
    if (p?.id) track({ data: { propertyId: p.id } }).catch(() => {});
  }, [p?.id, track]);

  if (isLoading) {
    return (
      <SiteLayout showFooter={false} compactHeader>
        <div className="animate-pulse bg-white">
          <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 sm:pt-5 lg:pt-6">
            <div className="aspect-[4/3] rounded-lg bg-neutral-100" />
          </div>
          <div className="mx-auto max-w-7xl space-y-3 px-3 py-4 sm:px-4">
            <div className="h-7 w-2/3 rounded bg-neutral-100" />
            <div className="h-5 w-1/3 rounded bg-neutral-100" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !p) {
    return (
      <SiteLayout showFooter={false} compactHeader>
        <div className="mx-auto max-w-lg bg-white px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-neutral-900">Property not found</h1>
          <Link to="/properties" className="mt-4 inline-flex items-center text-blue-600">
            ← Back to collection
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const images = collectPropertyImages(p.hero_image, p.images);
  const agent = p.agents as { whatsapp: string | null; phone: string | null } | null;
  const whatsappNumber = agent?.whatsapp ?? agent?.phone ?? BRAND.whatsapp;

  const contactPanel = (
    <PropertyContactPanel
      price={Number(p.price)}
      currency={p.currency}
      listingType={p.listing_type}
      propertyTitle={p.title}
      whatsapp={whatsappNumber}
    />
  );

  return (
    <SiteLayout showFooter={false} compactHeader overflowVisible>
      <article className="overflow-visible bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl overflow-visible px-3 pt-4 pb-16 safe-bottom sm:px-4 sm:pt-5 sm:pb-20 lg:pt-6 lg:pb-24">
          <Link
            to="/properties"
            className="mb-4 inline-flex items-center gap-1.5 py-1 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-900 sm:mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>

          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-5 lg:gap-y-4 xl:grid-cols-[1fr_320px]">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <PropertyImageGallery images={images} title={p.title} />
            </div>

            <aside className="mt-3 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:sticky lg:top-14 lg:self-start">
              {contactPanel}
            </aside>

            <div className="mt-3 min-w-0 sm:mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0">
              <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-neutral-900 text-white">{propertyTypeLabel(p.property_type)}</Badge>
                  <Badge variant="outline" className="border-neutral-300 text-neutral-700">
                    {statusLabel(p.status)}
                  </Badge>
                </div>
                <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900 text-balance sm:text-2xl lg:text-3xl">
                  {p.title}
                </h1>
                {p.city && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    {p.city}
                    {p.country ? `, ${p.country}` : ""}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-600">
                  {p.bedrooms != null && (
                    <span className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4 text-blue-500" /> {p.bedrooms} beds
                    </span>
                  )}
                  {p.bathrooms != null && (
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-blue-500" /> {p.bathrooms} baths
                    </span>
                  )}
                  {p.area_sqm != null && (
                    <span className="flex items-center gap-1.5">
                      <Maximize className="h-4 w-4 text-blue-500" />
                      {formatArea(Number(p.area_sqm), p.property_type)}
                    </span>
                  )}
                  {p.plot_size_sqm != null && Number(p.plot_size_sqm) !== Number(p.area_sqm) && (
                    <span className="flex items-center gap-1.5">
                      <Maximize className="h-4 w-4 text-blue-500" />
                      {formatArea(Number(p.plot_size_sqm), p.property_type)} plot
                    </span>
                  )}
                </div>

                {(p.features?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Amenities</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {p.features.map((f: string) => (
                        <li
                          key={f}
                          className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.description && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">About</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                      {p.description}
                    </p>
                  </div>
                )}

                {p.latitude != null && p.longitude != null && (
                  <div className="mt-5">
                    <Link to="/map">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 rounded-full border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                      >
                        <Map className="h-3.5 w-3.5" />
                        View on map
                      </Button>
                    </Link>
                    <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200">
                      <iframe
                        title="Location"
                        className="h-40 w-full sm:h-48"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}&q=${p.latitude},${p.longitude}&zoom=14`}
                      />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}
