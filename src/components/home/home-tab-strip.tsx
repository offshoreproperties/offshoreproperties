import { cn } from "@/lib/utils";
import type { HomeTab } from "@/components/public-header";

const TABS: { id: HomeTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
];

export function HomeTabStrip({
  active,
  onChange,
}: {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}) {
  return (
    <div className="relative z-10 -mt-1 px-2 pb-1 md:hidden">
      <div
        className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Listing type"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition",
              active === tab.id
                ? "bg-white text-neutral-900"
                : "bg-white/80 text-neutral-700 ring-1 ring-black/10",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
