import { splitAiParagraphs } from "@/lib/ai-format";
import { cn } from "@/lib/utils";

function renderInlineText(text: string, dark: boolean) {
  const linkClass = dark
    ? "break-all font-medium text-[#E8B923] underline underline-offset-2 hover:text-[#f5d76e]"
    : "break-all font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700";

  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      let label = part;
      try {
        const u = new URL(part);
        label = u.pathname.length > 1 ? u.pathname : part;
      } catch {
        /* keep full url */
      }
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {label}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderParagraph(text: string, key: number, dark = false) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((l) => l.startsWith("•"));
  const textClass = dark ? "text-[#F5E6D3]/90" : "text-neutral-700";
  const bulletClass = dark ? "africa-accent-dot mt-2" : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500";

  if (isBulletList) {
    return (
      <ul key={key} className="my-3 list-none space-y-2 pl-0">
        {lines.map((line, i) => (
          <li key={i} className={cn("flex gap-2 text-[15px] leading-relaxed", textClass)}>
            <span className={bulletClass} aria-hidden />
            <span>{renderInlineText(line.replace(/^•\s*/, ""), dark)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className={cn("mb-3 text-[15px] leading-relaxed last:mb-0", textClass)}>
      {renderInlineText(text, dark)}
    </p>
  );
}

/** Polished AI prose — no raw markdown asterisks; URLs become clickable links. */
export function AiReplyText({ text, variant = "light" }: { text: string; variant?: "light" | "dark" }) {
  const paragraphs = splitAiParagraphs(text);
  const dark = variant === "dark";
  return <div className="space-y-0">{paragraphs.map((block, i) => renderParagraph(block, i, dark))}</div>;
}
