/** Normalise AI text for polished, markdown-free UI display. */
export function normalizeAiReply(raw: string): string {
  let text = raw.trim();

  // Remove MATCHES line if leaked through
  text = text.replace(/\n?MATCHES:\s*\[[^\]]*\]\s*/gi, "").trim();

  // Strip markdown emphasis while keeping readable structure
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n");

  // Remove stray asterisks
  text = text.replace(/\*{2,}/g, "").replace(/(?<=\w)\*(?=\w)/g, "");

  return text.trim();
}

export function splitAiParagraphs(text: string): string[] {
  return normalizeAiReply(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
