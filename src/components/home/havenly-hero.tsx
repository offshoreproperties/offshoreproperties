import { Link } from "@tanstack/react-router";
import { HavenlySearch } from "@/components/home/havenly-search";
import { AiSearchField } from "@/components/ai-search-field";
import { PublicHeader, type HomeTab } from "@/components/public-header";
import { FadePhrases } from "@/components/fade-phrases";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroKenyaGallery } from "@/components/kenya-gallery-provider";

const HERO_PHRASES = [
  "Your Next Investment, Simplified",
  "Find Your Dream Property",
  "Smart Search, Handpicked Listings",
  "Where Location Meets Opportunity",
  "Real Estate Made Easy",
  "Premium Properties, Curated for You",
];

const RENT_PHRASES = [
  "Your Perfect Rental, Found",
  "Quality Rentals, Handpicked",
  "Move In, Live Well",
];

const BUY_PHRASES = [
  "Own Your Piece of Paradise",
  "Invest in Prime Real Estate",
  "Homes Worth Coming Home To",
];

type HavenlyHeroProps = {
  homeTab: HomeTab;
  onHomeTabChange: (tab: HomeTab) => void;
};

export function HavenlyHero({
  homeTab,
  onHomeTabChange,
}: HavenlyHeroProps) {
  const phrases =
    homeTab === "rent" ? RENT_PHRASES : homeTab === "buy" ? BUY_PHRASES : HERO_PHRASES;

  const subtitle =
    homeTab === "rent"
      ? "Curated rentals vetted for quality and location."
      : homeTab === "buy"
        ? "Handpicked homes ready for you to view."
        : "Explore curated properties — search, filter, and discover.";

  return (
    <div className="relative flex min-h-[min(78vh,680px)] min-h-[min(78dvh,680px)] w-full flex-col overflow-hidden sm:min-h-[min(85vh,820px)] sm:min-h-[min(85dvh,820px)]">
      <HeroKenyaGallery />
      {/* Light overlays — keep photos bright, darken only where text sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 to-transparent sm:h-32" />

      <PublicHeader variant="overlay" homeTab={homeTab} onHomeTabChange={onHomeTabChange} />

      <div className="relative z-10 mt-auto px-4 pb-4 sm:px-8 sm:pb-6 lg:px-10 lg:pb-8">
        <div className="max-w-2xl">
          <h1 className="min-h-[2.4em] text-[clamp(1.5rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white drop-shadow-md sm:min-h-[1.3em]">
            <FadePhrases key={homeTab} phrases={phrases} />
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/90 drop-shadow sm:mt-4 sm:text-base">
            {subtitle}
          </p>
        </div>

        <div className="mt-4 space-y-2 sm:mt-6 sm:ml-auto sm:max-w-[720px] sm:space-y-3">
          <AiSearchField variant="hero" />
          <div className="flex items-center justify-end gap-2">
            <Link to="/map">
              <Button
                variant="secondary"
                size="sm"
                className="h-11 gap-2 rounded-full border-white/40 bg-white/90 px-4 text-neutral-900 shadow-sm backdrop-blur hover:bg-white"
              >
                <Map className="h-4 w-4 shrink-0" />
                View map
              </Button>
            </Link>
          </div>
          <HavenlySearch
            listingType={homeTab === "rent" ? "rent" : homeTab === "buy" ? "sale" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
