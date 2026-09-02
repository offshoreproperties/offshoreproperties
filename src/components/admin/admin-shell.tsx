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

function SidebarNav({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
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
              "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
}

function SidebarFooter({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className="shrink-0 border-t border-slate-800 p-4">
      <p className="truncate text-xs text-slate-500">{email ?? "Admin"}</p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-10 w-full justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        onClick={onSignOut}
      >
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
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

  return (
    <div className="h-dvh-screen overflow-hidden bg-slate-100">
      {/* Desktop sidebar — fixed full viewport height, never scrolls with page */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-800/60 bg-slate-950 text-white lg:flex">
        <div className="shrink-0 border-b border-slate-800 px-4 py-5">
          <Link to="/" className="inline-flex">
            <BrandLogo size="sidebar" />
          </Link>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">Administration</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav pathname={pathname} />
        </div>
        <SidebarFooter email={user?.email} onSignOut={signOut} />
      </aside>

      <div className="flex h-dvh-screen min-w-0 flex-col lg:pl-[260px]">
        <header className="safe-top z-30 shrink-0 border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:min-h-16 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0 text-slate-700" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex w-[min(100vw-2rem,260px)] flex-col border-slate-800 bg-slate-950 p-0 text-white"
                >
                  <div className="shrink-0 border-b border-slate-800 px-4 py-5 pt-12">
                    <BrandLogo size="sidebar" />
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Administration
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                    <SidebarNav pathname={pathname} onNavigate={() => setNavOpen(false)} />
                  </div>
                  <SidebarFooter email={user?.email} onSignOut={signOut} />
                </SheetContent>
              </Sheet>
              <h2 className="truncate text-sm font-semibold text-slate-900 lg:text-base">{title}</h2>
            </div>
            <Link
              to="/properties"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 sm:px-3"
            >
              <span className="hidden min-[400px]:inline">View public site</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="scrollbar-offshore min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 safe-bottom sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
