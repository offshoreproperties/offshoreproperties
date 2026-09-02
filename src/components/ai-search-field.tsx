import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { aiSearch } from "@/lib/ai-search.functions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, ArrowRight } from "lucide-react";
import { AiAssistantIcon } from "@/components/icons/ai-assistant-icon";
import { AiReplyText } from "@/components/ai-reply-text";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FadeRotator } from "@/components/fade-phrases";
import { LocationBrowse } from "@/components/location-browse";

const AI_PROMPTS = [
  "3-bed in Karen with a pool, around Kshs 50M",
  "family apartment in Kilimani, walking distance to Yaya",
  "2-bed rental in Westlands under Kshs 120k",
  "garden home in Runda for a family of four",
  "what's available in Lavington for rent?",
  "land around Kiambu for building",
  "furnished short stay near Kilimani",
  "is Parklands good for young professionals?",
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
      setReply(
        err instanceof Error &&
          !err.message.includes("not configured") &&
          !err.message.includes("API key")
          ? err.message
          : "Our search assistant is taking a short break — browse listings below or message us on WhatsApp.",
      );
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
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600",
            isHero ? "h-8 w-8" : "h-7 w-7",
          )}
          aria-hidden
        >
          <AiAssistantIcon className={isHero ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </span>
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={focused ? "Area, budget, beds, lifestyle — whatever helps…" : undefined}
            className={cn(
              "w-full bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none sm:text-sm",
            )}
            aria-label="Describe the property you want"
          />
          {showFadePlaceholder && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center text-base text-neutral-400 sm:text-sm",
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
            "h-11 w-11 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 sm:h-9 sm:w-9",
          )}
          aria-label="Search listings"
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
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <AiAssistantIcon className="h-4 w-4" />
              </span>
              Let's find something that fits
            </SheetTitle>
            <SheetDescription className="text-left text-neutral-500">
              Tell us your budget, area, or how you live — we'll match listings and explain why they work.
            </SheetDescription>
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
                Checking our listings…
              </div>
            )}
            {reply && !loading && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                <AiReplyText text={reply} />
              </div>
            )}
            {matches.length > 0 && !loading && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Properties that fit</p>
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
                  See these in the collection →
                </Link>
              </div>
            )}
            {reply && !loading && matches.length === 0 && (
              <div className="mt-4 space-y-4">
                <Link
                  to="/properties"
                  search={{ q: query }}
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm text-blue-600 underline"
                >
                  See everything we have →
                </Link>
              </div>
            )}
            {!loading && (
              <div className="mt-6 border-t border-neutral-200 pt-4">
                <LocationBrowse onSelect={(loc) => void runSearch(`Show me properties in ${loc}`)} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
