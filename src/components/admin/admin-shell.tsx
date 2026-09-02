import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Building2, Inbox, Calendar, LogOut, Menu, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { clearAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { to: "/admin", label: "Analytics", icon: BarChart3, exact: true },
  { to: "/admin/properties", label: "Properties", icon: Building2 },
  { to: "/admin/drafts", label: "Drafts", icon: FileText },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/bookings", label: "Bookings", icon: Calendar },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Analytics",
  "/admin/properties": "Properties",
  "/admin/drafts": "Drafts",
  "/admin/leads": "Leads",
  "/admin/bookings": "Bookings",
};

function pageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/admin/drafts")) return "Drafts";
  if (pathname.startsWith("/admin/properties")) return "Properties";
  return "Admin";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAdminAuth();
  const title = pageTitle(pathname);
  const [navOpen, setNavOpen] = useState(false);

  function signOut() {
    clearAdminSession();
    window.location.href = "/adminlogin";
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      {links.map((link) => {
        const { to, label, icon: Icon } = link;
        const exact = "exact" in link && link.exact;
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-100">
      <aside className="hidden h-full w-[260px] shrink-0 flex-col bg-slate-950 text-white lg:flex">
        <div className="shrink-0 border-b border-slate-800 py-5 pl-2 pr-4">
          <Link to="/" className="-ml-0.5 inline-flex">
            <BrandLogo size="sidebar" />
          </Link>
          <p className="mt-2 pl-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">Administration</p>
        </div>
        <div className="min-h-0 flex-1">
          <NavLinks />
        </div>
        <div className="shrink-0 border-t border-slate-800 p-4">
          <p className="truncate text-xs text-slate-500">{user?.email ?? "Admin"}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-10 w-full justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="safe-top z-20 shrink-0 border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button size="icon" variant="ghost" className="h-11 w-11 text-slate-700" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="scrollbar-dark flex w-[min(100vw-2rem,260px)] flex-col overflow-y-auto border-slate-800 bg-slate-950 p-0 text-white">
                <div className="border-b border-slate-800 py-5 pl-2 pr-12 pt-12">
                  <BrandLogo size="sidebar" />
                  <p className="mt-2 pl-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Administration
                  </p>
                </div>
                <div className="min-h-0 flex-1">
                  <NavLinks onNavigate={() => setNavOpen(false)} />
                </div>
                <div className="shrink-0 border-t border-slate-800 p-4">
                  <p className="truncate text-xs text-slate-500">{user?.email ?? "Admin"}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-11 w-full justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h2 className="truncate text-sm font-semibold text-slate-900 lg:text-base">{title}</h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 sm:px-3"
          >
            <span className="hidden min-[400px]:inline">View public site</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          </div>
        </header>
        <main className="scrollbar-offshore min-h-0 flex-1 overflow-y-auto p-4 safe-bottom sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
