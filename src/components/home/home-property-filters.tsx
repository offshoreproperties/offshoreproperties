import { HavenlySearch } from "@/components/home/havenly-search";
import type { HomeTab } from "@/components/public-header";

type HomePropertyFiltersProps = {
  homeTab: HomeTab;
};

export function HomePropertyFilters({ homeTab }: HomePropertyFiltersProps) {
  const listingType =
    homeTab === "rent" ? "rent" : homeTab === "buy" ? "sale" : undefined;

  return (
    <section className="relative z-10 -mt-3 px-3 sm:-mt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-4">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
            Location, type &amp; budget
          </p>
          <HavenlySearch listingType={listingType} />
        </div>
      </div>
    </section>
  );
}
