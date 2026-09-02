import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { PropertyCard } from "@/components/property-card";
import { listSavedProperties } from "@/lib/social.functions";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: `Saved — ${BRAND.name}` }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  const fetch = useServerFn(listSavedProperties);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["saved-properties"],
    queryFn: () => fetch(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
  }, [loading, user]);

  return (
    <SiteLayout>
      <section className="page-panel">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Your shortlist</h1>
        <p className="mt-2 text-sm text-neutral-600">Properties you've saved — synced when you're signed in.</p>
        {!user && !loading && (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-center sm:mt-12 sm:p-12">
            <p className="text-base font-medium text-neutral-900 sm:text-lg">Sign in to see saved listings</p>
            <Button
              className="mt-4 h-11 rounded-full bg-neutral-900 px-6 text-white hover:bg-neutral-800"
              onClick={() => setAuthOpen(true)}
            >
              Create account
            </Button>
          </div>
        )}
        {user && isLoading && <div className="mt-8 h-48 animate-pulse rounded-xl bg-neutral-100" />}
        {user && !isLoading && properties.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-center text-neutral-600 sm:mt-12 sm:p-12">
            No saved homes yet. Have a look at what's{" "}
            <Link to="/properties" className="inline-flex min-h-[44px] items-center text-blue-600 underline">
              on the market
            </Link>{" "}
            and tap Save on anything you like.
          </div>
        )}
        {user && properties.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </SiteLayout>
  );
}
