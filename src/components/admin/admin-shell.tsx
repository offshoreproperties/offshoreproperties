import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Building2, Inbox, Calendar, LogOut, Menu, ExternalLink } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { clearAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { to: "/admin", label: "Analytics", icon: BarChart3, exact: true },
  { to: "/admin/properties", label: "Properties", icon: Building2 },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/bookings", label: "Bookings", icon: Calendar },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Analytics",
  "/admin/properties": "Properties",
  "/admin/leads": "Leads",
  "/admin/bookings": "Bookings",
};

function pageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/admin/properties")) return "Properties";
  return "Admin";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAdminAuth();
  const title = pageTitle(pathname);

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
              "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-700" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="scrollbar-dark w-[260px] overflow-y-auto border-slate-800 bg-slate-950 p-0 text-white">
                <div className="border-b border-slate-800 py-5 pl-2 pr-4">
                  <BrandLogo size="sidebar" />
                </div>
                <NavLinks onNavigate={() => {}} />
              </SheetContent>
            </Sheet>
            <h2 className="text-sm font-semibold text-slate-900 lg:text-base">{title}</h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
          >
            View public site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          </div>
        </header>
        <main className="scrollbar-offshore min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
