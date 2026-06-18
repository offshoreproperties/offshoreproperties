import type { ReactNode } from "react";

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1]) {
      nodes.push(
        <strong key={key++} className="font-semibold text-neutral-900">
          {match[1]}
        </strong>,
      );
    } else if (match[2]) {
      nodes.push(
        <em key={key++} className="italic">
          {match[2]}
        </em>,
      );
    } else if (match[3]) {
      nodes.push(
        <code key={key++} className="rounded bg-neutral-200/80 px-1 py-0.5 text-[0.9em]">
          {match[3]}
        </code>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? nodes : [text];
}

function renderBlock(block: string, key: number): ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  const lines = trimmed.split("\n");
  const isList = lines.every((line) => /^[-*•]\s+/.test(line.trim()));

  if (isList) {
    return (
      <ul key={key} className="my-2 list-disc space-y-1 pl-5">
        {lines.map((line, i) => (
          <li key={i}>{parseInline(line.replace(/^[-*•]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="mb-3 last:mb-0">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {parseInline(line)}
        </span>
      ))}
    </p>
  );
}

/** Renders common AI markdown (bold, italic, lists) as styled HTML. */
export function AiReplyText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return <div className="space-y-0">{blocks.map((block, i) => renderBlock(block, i))}</div>;
}
