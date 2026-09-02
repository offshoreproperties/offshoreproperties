import { HavenlySearch } from "@/components/home/havenly-search";
import type { HomeTab } from "@/components/public-header";
import { SlidersHorizontal } from "lucide-react";

type HomePropertyFiltersProps = {
  homeTab: HomeTab;
};

export function HomePropertyFilters({ homeTab }: HomePropertyFiltersProps) {
  const listingType =
    homeTab === "rent" ? "rent" : homeTab === "buy" ? "sale" : undefined;

  const hint =
    homeTab === "rent"
      ? "Monthly rent budgets and neighbourhoods across Nairobi & the coast."
      : homeTab === "buy"
        ? "Filter homes for sale by area, type, and budget."
        : "Browse everything we have — refine by area, type, or price.";

  return (
    <section className="relative z-10 -mt-1 px-3 sm:-mt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-md shadow-slate-200/40 sm:px-5 sm:py-5">
          <div className="mb-2 flex items-start gap-2 sm:mb-4 sm:gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-9 sm:w-9 sm:rounded-xl">
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 sm:text-base">Search listings</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-sm sm:leading-relaxed">{hint}</p>
            </div>
          </div>
          <HavenlySearch listingType={listingType} />
        </div>
      </div>
    </section>
  );
}
