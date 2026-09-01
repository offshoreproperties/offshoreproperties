import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
      "rounded-full px-4 py-2.5 text-sm font-medium transition-all min-h-[44px] sm:min-h-0 sm:py-2 sm:px-5",
      active
        ? onOverlay
          ? "bg-white text-neutral-900 shadow-sm"
          : "bg-neutral-900 text-white shadow-sm"
        : onOverlay
          ? "text-white/90 hover:text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
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

  return (
    <header
      className={cn(
        "relative z-20 flex items-center justify-between gap-2 sm:gap-4 lg:px-8",
        compact ? "px-3 py-2 sm:px-4 sm:py-2.5" : "px-3 py-3 sm:px-6 sm:py-5",
        overlay
          ? "safe-top"
          : "sticky top-0 border-b border-neutral-200 bg-white/95 backdrop-blur-md safe-top",
        className,
      )}
    >
      <Link
        to="/"
        className={cn(
          "shrink-0 text-lg font-bold tracking-tight drop-shadow-md sm:text-2xl",
          overlay ? "text-white" : "text-neutral-900",
        )}
      >
        Offshore<span className="text-blue-600">.</span>
      </Link>

      <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <div
          className={cn(
            "flex max-w-[min(100vw-12rem,42rem)] items-center gap-0.5 overflow-x-auto rounded-full p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            overlay
              ? "bg-white/10 ring-1 ring-white/15 backdrop-blur-md"
              : "bg-neutral-100 ring-1 ring-neutral-200",
          )}
        >
          {PILLS.map((item) => renderPill(item))}
        </div>
      </nav>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/properties" className="hidden min-[400px]:inline-flex">
          <Button
            size="sm"
            className="rounded-full bg-neutral-900 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-neutral-800 sm:px-5 sm:text-[11px]"
          >
            Browse
          </Button>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-11 w-11 shrink-0 rounded-full lg:hidden",
                overlay ? "text-white" : "text-neutral-900",
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
              <div className="my-2 border-t border-neutral-200" />
              <Link
                to="/properties"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center justify-center rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Browse collection
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
