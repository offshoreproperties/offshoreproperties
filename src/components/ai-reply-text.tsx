import { splitAiParagraphs } from "@/lib/ai-format";

function renderParagraph(text: string, key: number) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((l) => l.startsWith("•"));

  if (isBulletList) {
    return (
      <ul key={key} className="my-3 list-none space-y-2 pl-0">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-neutral-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
            <span>{line.replace(/^•\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="mb-3 text-[15px] leading-relaxed text-neutral-700 last:mb-0">
      {text}
    </p>
  );
}

/** Polished AI prose — no raw markdown asterisks. */
export function AiReplyText({ text }: { text: string }) {
  const paragraphs = splitAiParagraphs(text);
  return <div className="space-y-0">{paragraphs.map((block, i) => renderParagraph(block, i))}</div>;
}
