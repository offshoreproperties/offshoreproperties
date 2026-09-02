import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteVisitTracker } from "@/components/site-visit-tracker";
import { KenyaGalleryProvider } from "@/components/kenya-gallery-provider";
import { BRAND, brandOgImageUrl } from "@/lib/constants";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-white">
      <p className="text-xs uppercase tracking-[0.28em] text-[#2563eb]">404</p>
      <h1 className="mt-4 text-balance text-3xl font-bold sm:text-5xl">Page not found</h1>
      <p className="mt-3 max-w-sm text-center text-sm text-white/50">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
      >
        Return home
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-white">
      <h1 className="text-balance text-2xl font-bold sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-center text-sm text-white/50">
        We couldn&apos;t load this page. Please try again or return to the homepage.
      </p>
      {error?.message && (
        <p className="mt-4 max-w-md rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/60">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-full border border-white/20 px-6 text-xs uppercase tracking-wider text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

const OG_IMAGE = brandOgImageUrl();

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: BRAND.name },
      { name: "description", content: BRAND.tagline },
      { property: "og:title", content: BRAND.name },
      { property: "og:description", content: BRAND.tagline },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://offshoreproperties.co.ke" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <KenyaGalleryProvider>
        <ScrollToTop />
        <SiteVisitTracker />
        <Outlet />
        <FloatingWhatsApp />
        <Toaster position="top-center" richColors closeButton />
      </KenyaGalleryProvider>
    </QueryClientProvider>
  );
}
