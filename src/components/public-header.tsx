import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

export type HomeTab = "all" | "buy" | "rent";

const PILLS: {
  id: HomeTab | "map" | "about" | "contact";
  label: string;
  to: string;
  search?: { tab: HomeTab };
}[] = [
  { id: "all", label: "All", to: "/", search: { tab: "all" } },
  { id: "buy", label: "Buy", to: "/", search: { tab: "buy" } },
  { id: "rent", label: "Rent", to: "/", search: { tab: "rent" } },
  { id: "map", label: "Map", to: "/map" },
  { id: "about", label: "About", to: "/about" },
  { id: "contact", label: "Contact", to: "/contact" },
];

type PublicHeaderProps = {
  variant?: "overlay" | "bar";
  homeTab?: HomeTab;
  onHomeTabChange?: (tab: HomeTab) => void;
  className?: string;
  compact?: boolean;
};

export function PublicHeader({
  variant = "bar",
  homeTab = "all",
  onHomeTabChange,
  className,
  compact = false,
}: PublicHeaderProps) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlay = variant === "overlay";
  const isHome = pathname === "/";

  function isActive(id: (typeof PILLS)[number]["id"]) {
    if (id === "map") return pathname === "/map";
    if (id === "about") return pathname === "/about";
    if (id === "contact") return pathname === "/contact";
    if (isHome && (id === "all" || id === "buy" || id === "rent")) return homeTab === id;
    return false;
  }

  function pillClass(active: boolean, block = false) {
    const onOverlay = overlay && !block;
    return cn(
      block ? "w-full text-left" : "",
        "rounded-full px-4 py-2 text-sm font-medium transition-all min-h-[40px] sm:min-h-0 sm:py-2 sm:px-5",
      active
        ? onOverlay
          ? "bg-white text-neutral-900 shadow-sm"
          : "bg-white text-slate-900 shadow-sm"
        : onOverlay
          ? "text-white/90 hover:text-white"
          : "text-slate-300 hover:bg-white/10 hover:text-white",
    );
  }

  function renderPill(item: (typeof PILLS)[number], block = false) {
    const active = isActive(item.id);
    const isHomeFilter = item.id === "all" || item.id === "buy" || item.id === "rent";

    if (isHome && isHomeFilter && onHomeTabChange) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onHomeTabChange(item.id as HomeTab)}
          className={pillClass(active, block)}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.to}
        search={item.search}
        onClick={() => setMobileOpen(false)}
        className={pillClass(active, block)}
      >
        {item.label}
      </Link>
    );
  }

  function browseButtonClass(block = false) {
    return cn(
      "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300",
      block ? "min-h-[48px] w-full px-5 py-3 text-sm" : "hidden min-h-10 min-[400px]:inline-flex px-4 py-2.5 text-sm sm:min-h-11 sm:px-5",
      overlay
        ? "bg-white/95 text-blue-700 shadow-lg shadow-black/15 ring-1 ring-white/60 backdrop-blur-sm hover:bg-white hover:shadow-xl hover:shadow-black/20"
        : "relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:via-blue-600 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-600/35",
      !overlay &&
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/0 before:via-white/15 before:to-white/0 before:opacity-0 before:transition-opacity group-hover:before:opacity-100",
    );
  }

  function BrowseButton({ block = false, onNavigate }: { block?: boolean; onNavigate?: () => void }) {
    return (
      <Link to="/properties" onClick={onNavigate} className={browseButtonClass(block)}>
        <span className="relative z-[1]">Browse listings</span>
        <ArrowUpRight
          className={cn(
            "relative z-[1] h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            overlay ? "text-blue-600" : "text-white/90",
          )}
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <header
      className={cn(
        "relative z-20 w-full",
        overlay
          ? "safe-top"
          : "sticky top-0 safe-top border-b border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-lg shadow-black/30",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full",
          overlay
            ? "grid h-[5rem] max-w-[1440px] grid-cols-[1fr_auto] items-center gap-3 px-4 sm:h-[5.75rem] sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:h-[6.5rem] lg:px-8"
            : compact
              ? "grid h-[4.5rem] max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 sm:h-20 sm:px-6"
              : "grid h-[4.75rem] max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:h-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:h-[5.25rem] lg:px-8",
        )}
      >
      <Link
        to="/"
        className={cn(
          "flex items-center justify-self-start lg:col-start-1",
          overlay && "drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]",
        )}
      >
        <BrandLogo size={overlay ? "overlay" : "header"} />
      </Link>

      <nav
        className={cn(
          overlay
            ? "hidden justify-self-center md:flex lg:col-start-2"
            : "hidden justify-self-center lg:col-start-2 lg:flex",
        )}
      >
        <div
          className={cn(
            "flex max-w-[min(100vw-12rem,42rem)] items-center gap-1 overflow-x-auto rounded-full p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            overlay
              ? "bg-black/35 ring-1 ring-white/20 backdrop-blur-md"
              : "bg-white/10 ring-1 ring-white/15 backdrop-blur-sm",
          )}
        >
          {PILLS.map((item) => renderPill(item))}
        </div>
      </nav>

      <div className="flex items-center justify-end justify-self-end gap-2 sm:gap-3 lg:col-start-3">
        <BrowseButton />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-11 w-11 shrink-0 rounded-full lg:hidden",
                overlay ? "text-white" : "text-white hover:bg-white/10",
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100vw-2rem,24rem)] border-neutral-200 bg-white text-neutral-900">
            <SheetHeader>
              <SheetTitle className="text-left text-xl font-bold text-neutral-900">Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation and listing filters</SheetDescription>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              {PILLS.map((item) => renderPill(item, true))}
              <div className="my-3 border-t border-neutral-200" />
              <BrowseButton block onNavigate={() => setMobileOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      </div>
    </header>
  );
}
