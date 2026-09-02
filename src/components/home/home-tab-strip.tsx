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
    <div className="relative z-10 px-3 py-3 md:hidden">
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
              "inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition",
              active === tab.id
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-700 ring-1 ring-black/10",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
