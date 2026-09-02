import { Link } from "@tanstack/react-router";
import { HavenlySearch } from "@/components/home/havenly-search";
import { AiSearchField } from "@/components/ai-search-field";
import { FadePhrases } from "@/components/fade-phrases";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroKenyaGallery } from "@/components/kenya-gallery-provider";
import type { HomeTab } from "@/components/public-header";

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
};

export function HavenlyHero({ homeTab }: HavenlyHeroProps) {
  const phrases =
    homeTab === "rent" ? RENT_PHRASES : homeTab === "buy" ? BUY_PHRASES : HERO_PHRASES;

  const subtitle =
    homeTab === "rent"
      ? "We'll show you rentals that match your budget, commute, and how you actually live — no endless scrolling."
      : homeTab === "buy"
        ? "These are homes we'd take a client to see in person. Location, title, and value checked first."
        : "Same team behind every listing — search by area and budget, or just tell us what you're after.";

  return (
    <section className="relative mb-0 w-full overflow-hidden rounded-b-2xl shadow-lg shadow-slate-900/15 sm:rounded-b-3xl">
      <div className="relative flex min-h-[min(58vh,520px)] min-h-[min(58dvh,520px)] w-full flex-col sm:min-h-[min(64vh,580px)] sm:min-h-[min(64dvh,580px)] lg:min-h-[min(68vh,640px)]">
        <HeroKenyaGallery />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/5" />

        <div className="relative z-10 mt-auto px-4 pb-4 sm:px-8 sm:pb-5 lg:px-10 lg:pb-6">
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
    </section>
  );
}
