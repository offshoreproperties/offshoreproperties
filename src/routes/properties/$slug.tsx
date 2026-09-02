import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
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
import { PropertySection, PropertyStatStrip } from "@/components/property-detail/property-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  onContact,
}: {
  price: number;
  currency: string;
  listingType: string;
  whatsappUrl: string;
  onContact: () => void;
}) {
  return (
    <div className="mobile-action-bar lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-900">{formatPrice(price, currency, listingType)}</p>
        </div>
        <WhatsAppButton href={whatsappUrl} label="WhatsApp" className="h-11 w-auto shrink-0 px-3 text-sm" />
        <Button
          type="button"
          onClick={onContact}
          className="h-11 shrink-0 rounded-full bg-blue-600 px-4 text-sm hover:bg-blue-700"
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
  compact = false,
  className,
}: {
  price: number;
  currency: string;
  listingType: string;
  propertyContext: PropertyWhatsAppContext;
  whatsapp: string | null;
  propertyId: string;
  compact?: boolean;
  className?: string;
}) {
  const whatsappUrl = propertyWhatsAppUrl(whatsapp, propertyContext);

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {!compact && (
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <p className="text-2xl font-bold tracking-tight text-slate-900 xl:text-3xl">
            {formatPrice(price, currency, listingType)}
          </p>
          <div className="mt-3">
            <WhatsAppButton href={whatsappUrl} label="Chat on WhatsApp" />
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <Tabs defaultValue="enquiry">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <TabsTrigger
              value="enquiry"
              className="rounded-lg py-2.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm"
            >
              Send enquiry
            </TabsTrigger>
            <TabsTrigger
              value="viewing"
              className="rounded-lg py-2.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm"
            >
              Book viewing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="enquiry" className="mt-4 focus-visible:outline-none">
            <EnquiryForm
              propertyId={propertyId}
              propertyTitle={propertyContext.title}
              propertyContext={propertyContext}
              whatsapp={whatsapp}
            />
          </TabsContent>
          <TabsContent value="viewing" className="mt-4 focus-visible:outline-none">
            <ViewingForm
              propertyId={propertyId}
              propertyTitle={propertyContext.title}
              propertyContext={propertyContext}
              whatsapp={whatsapp}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Or call us</p>
          <ul className="mt-2 space-y-1">
            <li>
              <a
                href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                className="flex min-h-10 items-center gap-2 text-sm text-slate-700 hover:text-blue-600"
              >
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                {BRAND.phone}
              </a>
            </li>
            <li>
              <a
                href={`tel:${BRAND.phone2.replace(/\s/g, "")}`}
                className="flex min-h-10 items-center gap-2 text-sm text-slate-700 hover:text-blue-600"
              >
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                {BRAND.phone2}
              </a>
            </li>
          </ul>
          {compact && (
            <div className="mt-4">
              <WhatsAppButton href={whatsappUrl} label="Chat on WhatsApp" variant="outline" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyHeader({
  title,
  city,
  country,
  propertyType,
  status,
  listingBadges,
  isFeatured,
  shareUrl,
  shareText,
}: {
  title: string;
  city: string | null;
  country: string | null;
  propertyType: string;
  status: string;
  listingBadges: string[] | null;
  isFeatured: boolean;
  shareUrl: string;
  shareText: string;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-md bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-slate-900">
          {propertyTypeLabel(propertyType)}
        </Badge>
        <Badge variant="outline" className="rounded-md border-slate-200 text-slate-600">
          {statusLabel(status)}
        </Badge>
      </div>

      <ListingBadgesDisplay badges={listingBadges} isFeatured={isFeatured} size="md" />

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl lg:text-[2rem] lg:leading-tight">
        {title}
      </h1>

      {city && (
        <p className="flex items-start gap-2 text-sm text-slate-600 sm:text-base">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {city}
            {country ? `, ${country}` : ""}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <SharePropertyButton url={shareUrl} title={title} text={shareText} />
        <CopyPropertyLinkButton url={shareUrl} />
      </div>
    </header>
  );
}

function PropertyDetailPage() {
  const { slug } = Route.useParams();
  const { property: loaderProperty } = Route.useLoaderData();
  const fetch = useServerFn(getPropertyBySlug);
  const track = useServerFn(recordPropertyView);
  const contactRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState("overview");

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
      <SiteLayout showFooter={false} compactHeader mainClassName="bg-slate-50">
        <div className="animate-pulse">
          <div className="aspect-[4/3] bg-slate-200 sm:mx-auto sm:max-w-7xl sm:px-4 sm:pt-5">
            <div className="h-full w-full sm:rounded-2xl" />
          </div>
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
            <div className="h-8 w-2/3 rounded-lg bg-slate-200" />
            <div className="h-5 w-1/3 rounded-lg bg-slate-200" />
            <div className="h-16 rounded-xl bg-slate-200" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !p) {
    return (
      <SiteLayout showFooter={false} compactHeader>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Property not found</h1>
          <p className="mt-2 text-sm text-slate-500">This listing may have been removed or unpublished.</p>
          <Link to="/properties" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to listings
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

  const whatsappUrl = propertyWhatsAppUrl(whatsappNumber, propertyContext);

  const statItems = [
    p.bedrooms != null
      ? { icon: <Bed className="h-4 w-4" />, label: "Bedrooms", value: String(p.bedrooms) }
      : null,
    p.bathrooms != null
      ? { icon: <Bath className="h-4 w-4" />, label: "Bathrooms", value: String(p.bathrooms) }
      : null,
    p.area_sqm != null
      ? {
          icon: <Maximize className="h-4 w-4" />,
          label: "Area",
          value: formatArea(Number(p.area_sqm), p.property_type),
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

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

  const mobileContactPanel = (
    <PropertyContactPanel
      price={Number(p.price)}
      currency={p.currency}
      listingType={p.listing_type}
      propertyContext={propertyContext}
      whatsapp={whatsappNumber}
      propertyId={p.id}
      compact
    />
  );

  function openContact() {
    setMobileTab("contact");
    requestAnimationFrame(() => {
      contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const overviewContent = (
    <div className="space-y-6">
      {p.description && (
        <PropertySection title="About this property">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {p.description}
            </p>
          </div>
        </PropertySection>
      )}
      <PropertyAiAdvisor propertyId={p.id} propertyTitle={p.title} />
    </div>
  );

  const amenitiesContent =
    (p.features?.length ?? 0) > 0 ? (
      <PropertySection title="Amenities & features" description="What's included with this property">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <AmenitiesDisplay features={p.features ?? []} />
        </div>
      </PropertySection>
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No amenities listed for this property.
      </div>
    );

  const mapContent =
    p.latitude != null && p.longitude != null ? (
      <PropertySection
        title="Location"
        description={p.address ?? undefined}
        action={
          <Link to="/map">
            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full border-slate-200">
              <Map className="h-3.5 w-3.5" />
              All on map
            </Button>
          </Link>
        }
      >
        <PropertyLocationMap
          latitude={Number(p.latitude)}
          longitude={Number(p.longitude)}
          title={p.title}
          address={p.address}
          city={p.city}
          country={p.country}
          heroImage={p.hero_image}
        />
      </PropertySection>
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Map location not available for this listing.
      </div>
    );

  return (
    <SiteLayout showFooter={false} compactHeader mainClassName="bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="pb-24 lg:pb-10">
        {/* Gallery — edge-to-edge on mobile */}
        <div className="-mx-0 sm:mx-auto sm:max-w-7xl sm:px-4 sm:pt-5 lg:px-6">
          <PropertyImageGallery images={images} title={p.title} edgeToEdge />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:pt-6">
          <Link
            to="/properties"
            className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> All listings
          </Link>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8 xl:gap-10">
            {/* Main column */}
            <div className="min-w-0 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                <PropertyHeader
                  title={p.title}
                  city={p.city}
                  country={p.country}
                  propertyType={p.property_type}
                  status={p.status}
                  listingBadges={p.listing_badges}
                  isFeatured={p.is_featured}
                  shareUrl={shareUrl}
                  shareText={shareText}
                />

                {statItems.length > 0 && (
                  <div className="mt-5">
                    <PropertyStatStrip items={statItems} />
                  </div>
                )}

                {/* Mobile price — single place before tabs (not duplicated in sticky bar content) */}
                <p className="mt-5 text-2xl font-bold text-slate-900 lg:hidden">
                  {formatPrice(Number(p.price), p.currency, p.listing_type)}
                </p>
              </div>

              {/* Mobile: tabbed sections */}
              <div ref={contactRef} className="lg:hidden">
                <Tabs value={mobileTab} onValueChange={setMobileTab} className="w-full">
                  <TabsList className="scrollbar-hide flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1">
                    {[
                      { id: "overview", label: "Overview" },
                      { id: "amenities", label: "Amenities" },
                      { id: "map", label: "Map" },
                      { id: "contact", label: "Contact" },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="overview" className="mt-4 focus-visible:outline-none">
                    {overviewContent}
                  </TabsContent>
                  <TabsContent value="amenities" className="mt-4 focus-visible:outline-none">
                    {amenitiesContent}
                  </TabsContent>
                  <TabsContent value="map" className="mt-4 focus-visible:outline-none">
                    {mapContent}
                  </TabsContent>
                  <TabsContent value="contact" className="mt-4 focus-visible:outline-none">
                    {mobileContactPanel}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Desktop: stacked sections */}
              <div className="hidden space-y-8 lg:block">
                {overviewContent}
                {amenitiesContent}
                {mapContent}
              </div>
            </div>

            {/* Desktop sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-[calc(4.5rem+env(safe-area-inset-top))]">{contactPanel}</div>
            </aside>
          </div>
        </div>
      </article>

      <PropertyMobileActionBar
        price={Number(p.price)}
        currency={p.currency}
        listingType={p.listing_type}
        whatsappUrl={whatsappUrl}
        onContact={openContact}
      />
    </SiteLayout>
  );
}
