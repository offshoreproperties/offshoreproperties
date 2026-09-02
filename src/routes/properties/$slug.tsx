import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { getPropertyBySlug, recordPropertyView } from "@/lib/properties.functions";
import { buildPropertyHead, propertyOgDescription, propertyShareUrl } from "@/lib/property-share";
import { SharePropertyButton, CopyPropertyLinkButton } from "@/components/share-property-button";
import { SiteLayout } from "@/components/site-layout";
import {
  collectPropertyImages,
  PropertyImageGallery,
} from "@/components/property-image-gallery";
import { formatPrice, formatArea, propertyTypeLabel, statusLabel } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import { propertyWhatsAppUrl, type PropertyWhatsAppContext } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { EnquiryForm } from "@/components/enquiry-form";
import { ViewingForm } from "@/components/viewing-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bed, Bath, Maximize, MapPin, ArrowLeft, Map, Phone } from "lucide-react";
import { PropertyLocationMap } from "@/components/maps/property-location-map";
import { PropertyAiAdvisor } from "@/components/property-ai-advisor";
import { ListingBadgesDisplay } from "@/components/listing-badges-display";
import { AmenitiesDisplay } from "@/components/amenities-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/properties/$slug")({
  loader: async ({ params }) => {
    const property = await getPropertyBySlug({ data: { slug: params.slug } });
    return { property };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.property) {
      const readable = params.slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        meta: [
          { title: `${readable} | ${BRAND.name}` },
          { name: "description", content: `${readable} — ${BRAND.tagline}` },
        ],
      };
    }
    return buildPropertyHead(loaderData.property, params.slug);
  },
  component: PropertyDetailPage,
});

function PropertyMobileActionBar({
  price,
  currency,
  listingType,
  whatsappUrl,
  onEnquire,
}: {
  price: number;
  currency: string;
  listingType: string;
  whatsappUrl: string;
  onEnquire: () => void;
}) {
  return (
    <div className="mobile-action-bar lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-blue-600 sm:text-lg">
            {formatPrice(price, currency, listingType)}
          </p>
        </div>
        <WhatsAppButton href={whatsappUrl} label="WhatsApp" className="h-11 shrink-0 px-3 text-sm sm:px-4" />
        <Button
          type="button"
          onClick={onEnquire}
          className="h-11 shrink-0 rounded-full bg-neutral-900 px-4 text-sm hover:bg-neutral-800"
        >
          Enquire
        </Button>
      </div>
    </div>
  );
}

function PropertyContactPanel({
  price,
  currency,
  listingType,
  propertyContext,
  whatsapp,
  propertyId,
  className,
}: {
  price: number;
  currency: string;
  listingType: string;
  propertyContext: PropertyWhatsAppContext;
  whatsapp: string | null;
  propertyId: string;
  className?: string;
}) {
  const whatsappUrl = propertyWhatsAppUrl(whatsapp, propertyContext);

  return (
    <div className={className}>
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
        <p className="text-xl font-bold text-blue-600 sm:text-2xl lg:text-2xl xl:text-3xl">
          {formatPrice(price, currency, listingType)}
        </p>

        <div className="mt-3 space-y-2">
          <WhatsAppButton href={whatsappUrl} label="Chat on WhatsApp" />
          <p className="text-center text-[11px] text-neutral-500">
            Opens WhatsApp with this property&apos;s details pre-filled
          </p>
        </div>

        <Tabs defaultValue="enquiry" className="mt-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-neutral-100 p-1">
            <TabsTrigger value="enquiry" className="min-h-[44px] text-xs sm:text-sm">
              Enquire
            </TabsTrigger>
            <TabsTrigger value="viewing" className="min-h-[44px] text-xs sm:text-sm">
              Book viewing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="enquiry" className="mt-4">
            <EnquiryForm
              propertyId={propertyId}
              propertyTitle={propertyContext.title}
              propertyContext={propertyContext}
              whatsapp={whatsapp}
            />
          </TabsContent>
          <TabsContent value="viewing" className="mt-4">
            <ViewingForm
              propertyId={propertyId}
              propertyTitle={propertyContext.title}
              propertyContext={propertyContext}
              whatsapp={whatsapp}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Call us</p>
          <ul className="space-y-1 text-sm">
            <li>
              <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="flex min-h-[40px] items-center gap-2 text-blue-600 hover:underline">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {BRAND.phone}
              </a>
            </li>
            <li>
              <a href={`tel:${BRAND.phone2.replace(/\s/g, "")}`} className="flex min-h-[40px] items-center gap-2 text-blue-600 hover:underline">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {BRAND.phone2}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PropertyDetailPage() {
  const { slug } = Route.useParams();
  const { property: loaderProperty } = Route.useLoaderData();
  const fetch = useServerFn(getPropertyBySlug);
  const track = useServerFn(recordPropertyView);
  const contactRef = useRef<HTMLDivElement>(null);

  const { data: p, isLoading, error } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => fetch({ data: { slug } }),
    initialData: loaderProperty ?? undefined,
  });

  useEffect(() => {
    if (p?.id) track({ data: { propertyId: p.id } }).catch(() => {});
  }, [p?.id, track]);

  if (isLoading && loaderProperty === undefined) {
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
  const shareUrl = propertyShareUrl(p.slug ?? slug);
  const shareText = propertyOgDescription({
    title: p.title,
    slug: p.slug,
    price: Number(p.price),
    currency: p.currency,
    listing_type: p.listing_type,
    property_type: p.property_type,
    city: p.city,
    country: p.country,
    address: p.address,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    description: p.description,
    hero_image: p.hero_image,
    images: p.images,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    url: shareUrl,
    image: images[0] ?? undefined,
    description: p.description ?? shareText,
    address: p.city
      ? {
          "@type": "PostalAddress",
          addressLocality: p.city,
          addressCountry: p.country ?? "Kenya",
          streetAddress: p.address ?? undefined,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: Number(p.price),
      priceCurrency: p.currency,
      availability: "https://schema.org/InStock",
    },
  };

  const propertyContext: PropertyWhatsAppContext = {
    title: p.title,
    slug: p.slug,
    price: Number(p.price),
    currency: p.currency,
    listingType: p.listing_type,
    propertyType: p.property_type,
    city: p.city,
    country: p.country,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    address: p.address,
  };

  const contactPanel = (
    <PropertyContactPanel
      price={Number(p.price)}
      currency={p.currency}
      listingType={p.listing_type}
      propertyContext={propertyContext}
      whatsapp={whatsappNumber}
      propertyId={p.id}
    />
  );

  const whatsappUrl = propertyWhatsAppUrl(whatsappNumber, propertyContext);

  function scrollToContact() {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <SiteLayout showFooter={false} compactHeader overflowVisible>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="overflow-visible bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl overflow-visible px-3 pt-4 pb-24 safe-bottom sm:px-4 sm:pt-5 sm:pb-28 lg:pt-6 lg:pb-24">
          <Link
            to="/properties"
            className="mb-4 inline-flex min-h-11 items-center gap-1.5 py-2 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-900 sm:mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>

          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-5 lg:gap-y-4 xl:grid-cols-[1fr_320px]">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <PropertyImageGallery images={images} title={p.title} />
            </div>

            <aside className="hidden lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:sticky lg:top-[max(3.5rem,calc(3.5rem+env(safe-area-inset-top)))] lg:block lg:self-start">
              {contactPanel}
            </aside>

            <div className="mt-3 min-w-0 sm:mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0">
              <div className="mb-3 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 lg:hidden">
                <p className="text-xl font-bold text-blue-600">
                  {formatPrice(Number(p.price), p.currency, p.listing_type)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <WhatsAppButton href={whatsappUrl} label="Chat on WhatsApp" className="flex-1 sm:flex-none" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={scrollToContact}
                    className="h-11 flex-1 rounded-full border-neutral-300 sm:flex-none"
                  >
                    Enquire
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-neutral-900 text-white">{propertyTypeLabel(p.property_type)}</Badge>
                  <Badge variant="outline" className="border-neutral-300 text-neutral-700">
                    {statusLabel(p.status)}
                  </Badge>
                </div>
                <div className="mt-2">
                  <ListingBadgesDisplay
                    badges={p.listing_badges}
                    isFeatured={p.is_featured}
                    size="md"
                  />
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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <SharePropertyButton url={shareUrl} title={p.title} text={shareText} />
                  <CopyPropertyLinkButton url={shareUrl} />
                </div>

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
                  <div className="mt-5 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Amenities &amp; features
                    </p>
                    <div className="mt-4">
                      <AmenitiesDisplay features={p.features} />
                    </div>
                  </div>
                )}

                <PropertyAiAdvisor propertyId={p.id} propertyTitle={p.title} className="mt-5" />

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
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Location</p>
                      <Link to="/map">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 rounded-full border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                        >
                          <Map className="h-3.5 w-3.5" />
                          All on map
                        </Button>
                      </Link>
                    </div>
                    <PropertyLocationMap
                      latitude={Number(p.latitude)}
                      longitude={Number(p.longitude)}
                      title={p.title}
                      address={p.address}
                      city={p.city}
                      country={p.country}
                      heroImage={p.hero_image}
                    />
                  </div>
                )}
            </div>
          </div>

          <div ref={contactRef} id="property-contact" className="mt-8 scroll-mt-20 lg:hidden">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Get in touch
            </p>
            {contactPanel}
          </div>
        </div>
      </article>

      <PropertyMobileActionBar
        price={Number(p.price)}
        currency={p.currency}
        listingType={p.listing_type}
        whatsappUrl={whatsappUrl}
        onEnquire={scrollToContact}
      />
    </SiteLayout>
  );
}
