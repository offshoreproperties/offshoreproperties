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
    <section className="relative z-10 -mt-3 px-3 sm:-mt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-md shadow-slate-200/40 sm:px-5 sm:py-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">Search listings</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">{hint}</p>
            </div>
          </div>
          <HavenlySearch listingType={listingType} />
        </div>
      </div>
    </section>
  );
}
