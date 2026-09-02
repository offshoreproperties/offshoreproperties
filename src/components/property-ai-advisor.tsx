import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCircle } from "lucide-react";
import { AiAssistantIcon } from "@/components/icons/ai-assistant-icon";
import { propertyAdvisor } from "@/lib/property-advisor.functions";
import { AiReplyText } from "@/components/ai-reply-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_QUESTIONS = [
  "What's the neighbourhood like day to day?",
  "Who is this best suited for?",
  "What's nearby — schools, malls, commute?",
  "Does the price make sense for this area?",
];

export function PropertyAiAdvisor({
  propertyId,
  propertyTitle,
  className,
}: {
  propertyId: string;
  propertyTitle: string;
  className?: string;
}) {
  const ask = useServerFn(propertyAdvisor);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [areaLabel, setAreaLabel] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);

  async function run(questionText?: string) {
    const q = (questionText ?? question).trim();
    setLoading(true);
    setOpen(true);
    try {
      const result = await ask({
        data: {
          propertyId,
          question: q || undefined,
        },
      });
      setReply(result.reply);
      setAreaLabel(result.areaLabel ?? null);
      setQuestion("");
    } catch (err) {
      setReply(
        err instanceof Error &&
          !err.message.includes("not configured") &&
          !err.message.includes("API key")
          ? err.message
          : "We couldn't load that just now — message us on WhatsApp and we'll help directly.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-gradient-to-br from-blue-50/80 to-white p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-600 p-2 text-white">
          <AiAssistantIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Ask about this home</p>
          <h3 className="mt-0.5 font-semibold text-neutral-900">{propertyTitle}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Neighbourhood, daily life, who it suits — the same straight talk you'd get on a viewing.
          </p>
        </div>
      </div>

      {!open ? (
        <Button
          type="button"
          className="mt-4 h-10 w-full rounded-full bg-blue-600 hover:bg-blue-700"
          onClick={() => run()}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Tell me about this place
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Putting together what we know about this place…
            </div>
          ) : reply ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <AiReplyText text={reply} />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => run(q)}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-left text-xs text-neutral-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Is this quiet at night? How's the commute to Westlands?"
              className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none"
            />
            <Button type="submit" disabled={loading || !question.trim()} className="shrink-0 rounded-full">
              Ask
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
