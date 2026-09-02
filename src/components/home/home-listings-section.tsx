import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PropertyCard, type PropertyCardData } from "@/components/property-card";
import { cn } from "@/lib/utils";

type HomeListingsSectionProps = {
  listings: PropertyCardData[];
  isLoading: boolean;
  loadFailed?: boolean;
  allCount: number;
  homeTab: "all" | "buy" | "rent";
  sectionTitle: string;
  collectionSearch: Record<string, string>;
};

export function HomeListingsSection({
  listings,
  isLoading,
  loadFailed = false,
  allCount,
  homeTab,
  sectionTitle,
  collectionSearch,
}: HomeListingsSectionProps) {
  return (
    <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{sectionTitle}</h2>
        </div>
        <Link
          to="/properties"
          search={collectionSearch}
          className="group inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : loadFailed ? (
        <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 py-10 text-center text-sm text-amber-900">
          We couldn&apos;t refresh listings just now — please refresh the page. Your properties are
          still live; this is a temporary connection issue.
        </p>
      ) : listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          {allCount === 0
            ? "New listings coming soon — message us if you need help finding a place."
            : `No ${homeTab === "buy" ? "sale" : "rent"} listings — try All or the other tab.`}
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            listings.length <= 2
              ? "grid-cols-1 min-[520px]:grid-cols-2"
              : "grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {listings.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
