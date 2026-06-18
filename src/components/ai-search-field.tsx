import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { aiSearch } from "@/lib/ai-search.functions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FadeRotator } from "@/components/fade-phrases";

const AI_PROMPTS = [
  "3-bed villa with a pool under $500k",
  "family home with garden and parking",
  "affordable 2-bed apartment for rent",
  "luxury penthouse with rooftop terrace",
  "land for investment under $100k",
  "furnished rental near the city centre",
  "short let apartment for 2 weeks",
  "modern townhouse with 4 bedrooms",
];

type Match = {
  id: string;
  slug: string | null;
  title: string;
  hero_image: string | null;
  city: string | null;
  price: number;
  currency: string;
  listing_type: string;
};

export function AiSearchField({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "compact";
  className?: string;
}) {
  const runAi = useServerFn(aiSearch);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchSlugs, setMatchSlugs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const showFadePlaceholder = !focused && input === "";

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setOpen(true);
    setLoading(true);
    setReply(null);
    setMatches([]);
    setMatchSlugs([]);
    try {
      const result = await runAi({ data: { query: trimmed } });
      setReply(result.reply);
      setMatches(result.matches ?? []);
      setMatchSlugs(result.matchSlugs ?? []);
    } catch (err) {
      setReply(err instanceof Error ? err.message : "Search unavailable. Try browsing the collection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(input);
  }

  const isHero = variant === "hero";
  const slugsParam = matchSlugs.length > 0 ? matchSlugs.join(",") : undefined;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full items-center gap-2 overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md",
          isHero ? "px-3 py-2 sm:rounded-full sm:px-4 sm:py-2.5" : "rounded-full px-3 py-2",
          className,
        )}
      >
        <Sparkles
          className={cn("shrink-0 text-blue-600", isHero ? "h-4 w-4" : "h-3.5 w-3.5")}
          aria-hidden
        />
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={focused ? "Describe what you're looking for…" : undefined}
            className={cn(
              "w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none",
              isHero ? "text-[13px] sm:text-sm" : "text-[13px] sm:text-xs",
            )}
            aria-label="Describe your dream property"
          />
          {showFadePlaceholder && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center text-neutral-400",
                isHero ? "text-[13px] sm:text-sm" : "text-[13px] sm:text-xs",
              )}
              onClick={() => inputRef.current?.focus()}
            >
              <FadeRotator items={AI_PROMPTS} />
            </div>
          )}
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          className={cn(
            "shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
            isHero ? "h-9 w-9" : "h-9 w-9 sm:h-8 sm:w-8",
          )}
          aria-label="Search with AI"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
      </form>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col border-neutral-200 bg-white text-neutral-900 sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-left text-neutral-900">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI property assistant
            </SheetTitle>
          </SheetHeader>
          {query && (
            <p className="text-sm text-neutral-500">
              &ldquo;{query}&rdquo;
            </p>
          )}
          <div className="mt-4 flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Searching our listings…
              </div>
            )}
            {reply && !loading && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                {reply}
              </div>
            )}
            {matches.length > 0 && !loading && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Top matches</p>
                {matches.map((m) => (
                  <Link
                    key={m.id}
                    to="/properties/$slug"
                    params={{ slug: m.slug ?? m.id }}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    {m.hero_image ? (
                      <img src={m.hero_image} alt={m.title} loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-neutral-900">{m.title}</p>
                      <p className="text-sm font-medium text-blue-600">
                        {formatPrice(Number(m.price), m.currency, m.listing_type)}
                      </p>
                      {m.city && <p className="text-xs text-neutral-500">{m.city}</p>}
                    </div>
                  </Link>
                ))}
                <Link
                  to="/properties"
                  search={{
                    q: query,
                    ai: "1",
                    ...(slugsParam ? { slugs: slugsParam } : {}),
                  }}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-center text-sm font-medium text-blue-600 underline"
                >
                  View all AI matches in collection →
                </Link>
              </div>
            )}
            {reply && !loading && matches.length === 0 && (
              <Link
                to="/properties"
                search={{ q: query }}
                onClick={() => setOpen(false)}
                className="mt-4 block text-center text-sm text-blue-600 underline"
              >
                Browse all listings →
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
