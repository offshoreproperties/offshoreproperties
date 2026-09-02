import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { createEmptyPropertyDraft } from "@/lib/property-drafts.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/drafts/new")({
  component: NewDraftRedirect,
});

function NewDraftRedirect() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const create = useServerFn(createEmptyPropertyDraft);
  const started = useRef(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/adminlogin" });
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin || started.current) return;
    started.current = true;
    void create()
      .then((draft) => {
        navigate({
          to: "/admin/drafts/$draftId",
          params: { draftId: draft.id },
          replace: true,
        });
      })
      .catch(() => {
        started.current = false;
      });
  }, [isAdmin, create, navigate]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-600">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm">Creating your draft…</p>
    </div>
  );
}
