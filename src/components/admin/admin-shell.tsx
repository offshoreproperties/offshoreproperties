import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Inbox, Calendar, LogOut, Menu } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { clearAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/properties", label: "Properties", icon: Building2 },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/bookings", label: "Bookings", icon: Calendar },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAdminAuth();

  function signOut() {
    clearAdminSession();
    window.location.href = "/adminlogin";
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 p-4">
      {links.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-smooth",
            (exact ? pathname === to : pathname.startsWith(to))
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-5 py-6">
          <Link to="/" className="font-display text-xl text-sidebar-foreground">
            Offshore<span className="text-sidebar-primary">.</span>
          </Link>
          <p className="mt-1 text-xs text-sidebar-foreground/60">Administration</p>
        </div>
        <NavLinks />
        <div className="mt-auto border-t border-sidebar-border p-4">
          <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 h-11 w-full justify-start gap-2 text-sidebar-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-top flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
              <div className="border-b border-sidebar-border px-5 py-5 font-display text-xl">Admin</div>
              <NavLinks onNavigate={() => {}} />
            </SheetContent>
          </Sheet>
          <Link to="/properties" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-brass">
            View public site →
          </Link>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
