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
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <AiAssistantIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Property assistant</p>
          <h3 className="mt-0.5 font-semibold text-slate-900">Ask about this home</h3>
          <p className="mt-1 text-sm text-slate-600">
            Neighbourhood, daily life, who it suits — straight answers before you book a viewing.
          </p>
        </div>
      </div>

      {!open ? (
        <Button
          type="button"
          className="mt-4 h-11 w-full rounded-full bg-blue-600 hover:bg-blue-700"
          onClick={() => run()}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Tell me about this place
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Putting together what we know about this place…
            </div>
          ) : reply ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about this property…"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <Button type="submit" disabled={loading || !question.trim()} className="shrink-0 rounded-full sm:px-6">
              Ask
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
