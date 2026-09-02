import { useState, useRef, useEffect, useCallback } from "react";
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
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
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

const QUICK_PROMPTS = [
  "2-bed rental in Kilimani",
  "Homes for sale in Karen",
  "Land in Kiambu",
  "Furnished short stay",
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

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  matches?: Match[];
  matchSlugs?: string[];
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiSearchField({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "compact" | "floating";
  className?: string;
}) {
  const runAi = useServerFn(aiSearch);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, turns, loading, scrollToBottom]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => chatInputRef.current?.focus(), 300);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  async function runSearch(q: string, fromChat = false) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setOpen(true);
    setLastQuery(trimmed);
    if (!fromChat) setInput(trimmed);
    setChatInput("");

    const userTurn: ChatTurn = { id: newId(), role: "user", text: trimmed };
    setTurns((prev) => [...prev, userTurn]);
    setLoading(true);
    scrollToBottom();

    try {
      const result = await runAi({ data: { query: trimmed } });
      const assistantTurn: ChatTurn = {
        id: newId(),
        role: "assistant",
        text: result.reply,
        matches: result.matches ?? [],
        matchSlugs: result.matchSlugs ?? [],
      };
      setTurns((prev) => [...prev, assistantTurn]);
    } catch (err) {
      const message =
        err instanceof Error &&
        !err.message.includes("not configured") &&
        !err.message.includes("API key")
          ? err.message
          : "Our search assistant is taking a short break — browse listings below or message us on WhatsApp.";
      setTurns((prev) => [...prev, { id: newId(), role: "assistant", text: message }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleHeroSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(input);
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(chatInput, true);
  }

  const isHero = variant === "hero";
  const isFloating = variant === "floating";
  const showFadePlaceholder = !focused && input === "";
  const heroPlaceholder = "Use AI to refine your search";

  return (
    <>
      <form
        onSubmit={handleHeroSubmit}
        className={cn(
          "flex w-full items-center gap-1.5 overflow-hidden",
          isHero
            ? "rounded-full border border-white/30 bg-slate-950/45 px-2 py-1.5 shadow-lg shadow-black/25 backdrop-blur-md sm:gap-2 sm:px-2.5 sm:py-1.5"
            : "bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md",
          isFloating
            ? "rounded-full px-3 py-2 shadow-xl ring-black/10"
            : !isHero && "rounded-full px-3 py-2",
          className,
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            isHero
              ? "h-6 w-6 bg-gradient-to-br from-cyan-400/90 to-blue-600/90 text-white shadow-sm sm:h-7 sm:w-7"
              : "bg-blue-50 text-blue-600",
            !isHero && (isFloating ? "h-8 w-8" : "h-7 w-7"),
          )}
          aria-hidden
        >
          <AiAssistantIcon
            className={cn(isHero ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : isFloating ? "h-4 w-4" : "h-3.5 w-3.5")}
          />
        </span>
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={
              isHero
                ? focused
                  ? "Area, budget, beds…"
                  : heroPlaceholder
                : focused
                  ? "Area, budget, beds…"
                  : undefined
            }
            className={cn(
              "w-full bg-transparent focus:outline-none",
              isHero
                ? "text-xs text-white placeholder:text-white/55 sm:text-sm"
                : "text-neutral-900 placeholder:text-neutral-400",
              !isHero && (isFloating ? "text-sm" : "text-base sm:text-sm"),
            )}
            aria-label="Describe the property you want"
          />
          {showFadePlaceholder && !isHero && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center text-neutral-400",
                isFloating ? "text-sm" : "text-base sm:text-sm",
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
            "shrink-0 rounded-full disabled:opacity-40",
            isHero
              ? "h-10 w-10 bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25 sm:h-11 sm:w-11"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
            !isHero && (isFloating ? "h-9 w-9" : "h-11 w-11 sm:h-9 sm:w-9"),
          )}
          aria-label="Search listings"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
          ) : (
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          )}
        </Button>
      </form>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 overflow-hidden border-neutral-200 bg-neutral-50 p-0 sm:max-w-md"
        >
          {/* Header — fixed */}
          <SheetHeader className="shrink-0 space-y-1 border-b border-neutral-200 bg-white px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] pr-14 text-left">
            <SheetTitle className="flex items-center gap-3 text-base font-bold text-neutral-900 sm:text-lg">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25">
                <AiAssistantIcon className="h-5 w-5" />
              </span>
              Property assistant
            </SheetTitle>
            <SheetDescription className="text-left text-sm leading-relaxed text-neutral-500">
              Ask about areas, budget, or lifestyle — I&apos;ll match listings and explain why they fit.
            </SheetDescription>
          </SheetHeader>

          {/* Messages — scrollable */}
          <div
            ref={scrollRef}
            className="scrollbar-offshore min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4"
          >
            {turns.length === 0 && !loading && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-5 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-blue-500" aria-hidden />
                  <p className="mt-2 text-sm font-medium text-neutral-800">Try asking something like</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void runSearch(prompt, true)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
                <LocationBrowse compact layout="wrap" onSelect={(loc) => void runSearch(`Show me properties in ${loc}`, true)} />
              </div>
            )}

            <div className="space-y-4">
              {turns.map((turn) =>
                turn.role === "user" ? (
                  <div key={turn.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                      {turn.text}
                    </div>
                  </div>
                ) : (
                  <div key={turn.id} className="flex justify-start">
                    <div className="max-w-[92%] space-y-3">
                      <div className="rounded-2xl rounded-tl-md border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
                        <AiReplyText text={turn.text} />
                      </div>

                      {turn.matches && turn.matches.length > 0 && (
                        <div className="space-y-2">
                          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                            Matches ({turn.matches.length})
                          </p>
                          {turn.matches.map((m) => (
                            <Link
                              key={m.id}
                              to="/properties/$slug"
                              params={{ slug: m.slug ?? m.id }}
                              onClick={() => setOpen(false)}
                              className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
                            >
                              {m.hero_image ? (
                                <img
                                  src={m.hero_image}
                                  alt=""
                                  loading="lazy"
                                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[10px] text-neutral-400">
                                  No photo
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold leading-snug text-neutral-900">{m.title}</p>
                                <p className="mt-0.5 text-sm font-medium text-blue-600">
                                  {formatPrice(Number(m.price), m.currency, m.listing_type)}
                                </p>
                                {m.city && <p className="text-xs text-neutral-500">{m.city}</p>}
                              </div>
                              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                            </Link>
                          ))}
                          <Link
                            to="/properties"
                            search={{
                              q: lastQuery,
                              ai: "1",
                              ...(turn.matchSlugs?.length ? { slugs: turn.matchSlugs.join(",") } : {}),
                            }}
                            onClick={() => setOpen(false)}
                            className="flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                          >
                            View all matches
                          </Link>
                        </div>
                      )}

                      {(!turn.matches || turn.matches.length === 0) && (
                        <Link
                          to="/properties"
                          search={{ q: lastQuery }}
                          onClick={() => setOpen(false)}
                          className="flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          Browse all listings
                        </Link>
                      )}
                    </div>
                  </div>
                ),
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-neutral-600">Checking our listings…</span>
                  </div>
                </div>
              )}
            </div>

            {turns.length > 0 && !loading && (
              <div className="mt-6 border-t border-neutral-200 pt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Explore by area
                </p>
                <LocationBrowse compact layout="wrap" onSelect={(loc) => void runSearch(`Show me properties in ${loc}`, true)} />
              </div>
            )}

            <div ref={bottomRef} className="h-1 shrink-0" aria-hidden />
          </div>

          {/* Input — fixed footer */}
          <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a follow-up…"
                disabled={loading}
                className="min-h-11 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 sm:text-sm"
                aria-label="Message property assistant"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !chatInput.trim()}
                className="h-11 w-11 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
