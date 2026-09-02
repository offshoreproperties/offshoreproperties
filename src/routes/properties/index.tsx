import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProperties } from "@/lib/properties.functions";
import { SiteLayout } from "@/components/site-layout";
import { PropertyCard } from "@/components/property-card";
import { PropertyFilters, type PropertySearch } from "@/components/property-filters";
import { SectionHeading } from "@/components/section-heading";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Map, Loader2 } from "lucide-react";
import { AiSearchField } from "@/components/ai-search-field";
import { z } from "zod";

const PAGE_SIZE = 24;

const searchSchema = z.object({
  q: z.string().optional(),
  propertyType: z.string().optional(),
  listingType: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  maxPrice: z.string().optional(),
  ai: z.string().optional(),
  slugs: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/properties/")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: `Collection — ${BRAND.name}` },
      { name: "description", content: "Browse curated villas, apartments, townhouses, and land." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetch = useServerFn(listProperties);

  const page = search.page ?? 1;
  const aiSlugs = search.slugs?.split(",").map((s) => s.trim()).filter(Boolean);

  const filters = {
    query: search.ai ? undefined : search.q,
    propertyType: search.propertyType,
    listingType: search.listingType,
    city: search.city,
    location: search.location ?? search.city,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
    slugs: aiSlugs?.length ? aiSlugs : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["properties", filters, page],
    queryFn: () =>
      fetch({
        data: {
          query: filters.query,
          propertyType: filters.propertyType,
          listingType: filters.listingType,
          city: filters.city,
          location: filters.location,
          maxPrice: filters.maxPrice,
          slugs: filters.slugs,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        },
      }),
  });

  const properties = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function setSearch(patch: Partial<PropertySearch>) {
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });
  }

  function reset() {
    navigate({ search: {} });
  }

  function goToPage(p: number) {
    navigate({ search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const values: PropertySearch = {
    q: search.q,
    propertyType: search.propertyType,
    listingType: search.listingType,
    city: search.city,
    location: search.location ?? search.city,
  };

  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-[#f8fafc] to-white text-[#0a0a0a]">
        <section className="border-b border-black/10 px-4 py-6 sm:px-6 sm:py-14">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <SectionHeading
              variant="light"
              eyebrow="The collection"
              title="Our properties"
              description="Every listing is vetted for location, craft, and long-term value."
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link to="/map">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 gap-2 rounded-full border-black/15 text-[#0a0a0a] hover:bg-black/5"
                >
                  <Map className="h-4 w-4" /> View map
                </Button>
              </Link>
              <AiSearchField variant="compact" className="w-full sm:max-w-sm" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 safe-bottom sm:px-6 sm:py-14">
          <PropertyFilters values={values} onChange={setSearch} onReset={reset} variant="light" />
          {search.location && (
            <p className="mt-4 text-sm text-neutral-600">
              Properties in <span className="font-medium text-neutral-900">{search.location}</span>
            </p>
          )}
          {search.ai && search.q && (
            <p className="mt-4 text-sm text-neutral-600">
              AI picks for &ldquo;{search.q}&rdquo;
              {aiSlugs?.length ? ` — ${aiSlugs.length} matched` : ""}
            </p>
          )}
          {isLoading ? (
            <div className="mt-8 flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
            </div>
          ) : properties.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center sm:mt-16 sm:p-16">
              <p className="text-xl font-bold text-[#0a0a0a] sm:text-2xl">No matches found</p>
              <p className="mt-2 text-sm text-black/50">Adjust filters or explore all listings.</p>
              <Link
                to="/properties"
                search={{}}
                className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold uppercase tracking-wider text-[#64748b]"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-black/50">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} properties
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {properties.map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="h-11 min-w-[6.5rem] rounded-full border-black/15 text-[#0a0a0a] hover:bg-black/5 disabled:opacity-30"
                  >
                    Previous
                  </Button>
                  <span className="px-3 text-sm text-black/50">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="h-11 min-w-[6.5rem] rounded-full border-black/15 text-[#0a0a0a] hover:bg-black/5 disabled:opacity-30"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
