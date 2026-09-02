import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { savePropertyDraft } from "@/lib/property-drafts.functions";
import {
  hasDraftContent,
  snapshotToDraftPayload,
  type PropertyFormDraftSnapshot,
} from "@/lib/property-draft";
import { userFacingError } from "@/lib/user-facing-error";

const AUTOSAVE_MS = 1500;

type UsePropertyDraftAutosaveOptions = {
  draftId: string | null;
  onDraftIdChange: (id: string) => void;
  getSnapshot: () => PropertyFormDraftSnapshot;
  enabled?: boolean;
};

export function usePropertyDraftAutosave({
  draftId,
  onDraftIdChange,
  getSnapshot,
  enabled = true,
}: UsePropertyDraftAutosaveOptions) {
  const saveDraft = useServerFn(savePropertyDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef(draftId);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);

  draftIdRef.current = draftId;

  const flushSave = useCallback(async () => {
    if (!enabled || savingRef.current) {
      pendingRef.current = true;
      return;
    }

    const snapshot = getSnapshot();
    const payload = snapshotToDraftPayload(snapshot);
    if (!draftIdRef.current && !hasDraftContent(payload)) return;

    savingRef.current = true;
    setSaveState("saving");
    try {
      const row = await saveDraft({
        data: {
          id: draftIdRef.current ?? undefined,
          property_id: snapshot.propertyId ?? null,
          payload,
        },
      });
      draftIdRef.current = row.id;
      onDraftIdChange(row.id);
      setLastSavedAt(new Date());
      setSaveState("saved");
    } catch (error) {
      console.error("[draft-autosave]", error);
      setSaveState("error");
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void flushSave();
      }
    }
  }, [enabled, getSnapshot, onDraftIdChange, saveDraft]);

  const scheduleSave = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushSave();
    }, AUTOSAVE_MS);
  }, [enabled, flushSave]);

  useEffect(() => {
    if (!enabled) return;

    function onHide() {
      if (document.visibilityState === "hidden") void flushSave();
    }

    function onBeforeUnload() {
      void flushSave();
    }

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, flushSave]);

  return {
    saveState,
    lastSavedAt,
    flushSave,
    scheduleSave,
    errorMessage:
      saveState === "error"
        ? userFacingError(null, "Could not save draft — check your connection.")
        : null,
  };
}
