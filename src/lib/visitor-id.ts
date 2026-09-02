const VISITOR_ID_KEY = "offshore_visitor_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Stable anonymous visitor id — persisted in localStorage for likes/saves. */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const id = randomId();
    localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}
