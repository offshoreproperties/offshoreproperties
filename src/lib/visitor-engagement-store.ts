import { getOrCreateVisitorId } from "@/lib/visitor-id";

const STORAGE_KEY = "offshore_visitor_engagement_v1";
const SYNC_EVENT = "offshore-engagement-change";

export type VisitorEngagementState = {
  visitorId: string;
  likes: Record<string, true>;
  saves: Record<string, true>;
  updatedAt: string;
};

function emptyState(visitorId: string): VisitorEngagementState {
  return { visitorId, likes: {}, saves: {}, updatedAt: new Date().toISOString() };
}

function readRaw(): VisitorEngagementState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VisitorEngagementState;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      visitorId: parsed.visitorId || getOrCreateVisitorId(),
      likes: parsed.likes ?? {},
      saves: parsed.saves ?? {},
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function write(state: VisitorEngagementState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: state }));
  } catch {
    /* quota / private mode */
  }
}

export function getVisitorEngagementState(): VisitorEngagementState {
  const visitorId = getOrCreateVisitorId();
  const existing = readRaw();
  if (existing) {
    if (existing.visitorId !== visitorId) {
      const merged = { ...existing, visitorId, updatedAt: new Date().toISOString() };
      write(merged);
      return merged;
    }
    return existing;
  }
  const fresh = emptyState(visitorId);
  write(fresh);
  return fresh;
}

export function subscribeVisitorEngagement(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(SYNC_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SYNC_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function isPropertyLiked(propertyId: string): boolean {
  return !!getVisitorEngagementState().likes[propertyId];
}

export function isPropertySaved(propertyId: string): boolean {
  return !!getVisitorEngagementState().saves[propertyId];
}

export function getSavedPropertyIds(): string[] {
  return Object.keys(getVisitorEngagementState().saves);
}

export function toggleVisitorLike(propertyId: string): boolean {
  const state = getVisitorEngagementState();
  const next = { ...state.likes };
  if (next[propertyId]) delete next[propertyId];
  else next[propertyId] = true;
  write({ ...state, likes: next, updatedAt: new Date().toISOString() });
  return !!next[propertyId];
}

export function toggleVisitorSave(propertyId: string): boolean {
  const state = getVisitorEngagementState();
  const next = { ...state.saves };
  if (next[propertyId]) delete next[propertyId];
  else next[propertyId] = true;
  write({ ...state, saves: next, updatedAt: new Date().toISOString() });
  return !!next[propertyId];
}

export function exportVisitorEngagementForSync(): {
  visitorId: string;
  likes: string[];
  saves: string[];
} {
  const state = getVisitorEngagementState();
  return {
    visitorId: state.visitorId,
    likes: Object.keys(state.likes),
    saves: Object.keys(state.saves),
  };
}
