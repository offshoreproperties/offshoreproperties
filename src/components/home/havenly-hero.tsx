import { Link } from "@tanstack/react-router";
import { AiSearchField } from "@/components/ai-search-field";
import { FadePhrases } from "@/components/fade-phrases";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroKenyaGallery } from "@/components/kenya-gallery-provider";
import { PublicHeader, type HomeTab } from "@/components/public-header";

const HERO_PHRASES = [
  "Let's find you the right home",
  "Good properties in the right neighbourhoods",
  "Tell us what you need — we'll point you the right way",
  "From Kilimani to Karen, we know these areas",
  "Homes worth actually going to see",
  "Buying, renting, or investing — start here",
];

const RENT_PHRASES = [
  "Need a rental that fits your life?",
  "Let's find somewhere you'll enjoy living",
  "Westlands, Kilimani, Lavington — we'll narrow it down",
];

const BUY_PHRASES = [
  "Ready to buy? Location comes first",
  "Homes with real value behind them",
  "Something you'll still love in five years",
];

type HavenlyHeroProps = {
  homeTab: HomeTab;
  onHomeTabChange: (tab: HomeTab) => void;
};

export function HavenlyHero({ homeTab, onHomeTabChange }: HavenlyHeroProps) {
  const phrases =
    homeTab === "rent" ? RENT_PHRASES : homeTab === "buy" ? BUY_PHRASES : HERO_PHRASES;

  const subtitle =
    homeTab === "rent"
      ? "We'll show you rentals that match your budget, commute, and how you actually live — no endless scrolling."
      : homeTab === "buy"
        ? "These are homes we'd take a client to see in person. Location, title, and value checked first."
        : "Same team behind every listing — search by area and budget, or just tell us what you're after.";

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative flex min-h-[min(58dvh,520px)] w-full flex-col sm:min-h-[min(68vh,620px)] sm:min-h-[min(68dvh,620px)] lg:min-h-[min(80vh,760px)] lg:min-h-[min(80dvh,760px)]">
        <HeroKenyaGallery />

        <PublicHeader
          variant="overlay"
          homeTab={homeTab}
          onHomeTabChange={onHomeTabChange}
          className="absolute inset-x-0 top-0"
        />

        <div className="relative z-10 mt-auto w-full px-4 pb-6 pt-24 sm:px-8 sm:pb-10 sm:pt-32 lg:px-10 lg:pb-12 lg:pt-36">
          <div className="max-w-2xl">
            <h1 className="min-h-[2.4em] text-[clamp(1.5rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white drop-shadow-md sm:min-h-[1.3em]">
              <FadePhrases key={homeTab} phrases={phrases} />
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/90 drop-shadow sm:mt-4 sm:text-base">
              {subtitle}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <Link to="/map" className="shrink-0">
              <Button
                variant="secondary"
                size="sm"
                className="h-10 gap-2 rounded-full border-white/40 bg-white/90 px-4 text-neutral-900 shadow-sm backdrop-blur hover:bg-white sm:h-11"
              >
                <Map className="h-4 w-4 shrink-0" />
                View map
              </Button>
            </Link>
            <div className="w-full sm:max-w-[17rem] md:max-w-xs sm:-translate-y-3 md:-translate-y-4">
              <AiSearchField variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
