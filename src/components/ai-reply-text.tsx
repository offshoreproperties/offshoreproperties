import { splitAiParagraphs } from "@/lib/ai-format";
import { cn } from "@/lib/utils";

function renderParagraph(text: string, key: number, dark = false) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((l) => l.startsWith("•"));
  const textClass = dark ? "text-amber-50/90" : "text-neutral-700";
  const bulletClass = dark ? "maasai-bead-dot mt-2" : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500";

  if (isBulletList) {
    return (
      <ul key={key} className="my-3 list-none space-y-2 pl-0">
        {lines.map((line, i) => (
          <li key={i} className={cn("flex gap-2 text-[15px] leading-relaxed", textClass)}>
            <span className={bulletClass} aria-hidden />
            <span>{line.replace(/^•\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className={cn("mb-3 text-[15px] leading-relaxed last:mb-0", textClass)}>
      {text}
    </p>
  );
}

/** Polished AI prose — no raw markdown asterisks. */
export function AiReplyText({ text, variant = "light" }: { text: string; variant?: "light" | "dark" }) {
  const paragraphs = splitAiParagraphs(text);
  const dark = variant === "dark";
  return <div className="space-y-0">{paragraphs.map((block, i) => renderParagraph(block, i, dark))}</div>;
}
