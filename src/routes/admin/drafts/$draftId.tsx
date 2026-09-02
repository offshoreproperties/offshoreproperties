import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  deletePropertyDraft,
  getPropertyDraft,
} from "@/lib/property-drafts.functions";
import { upsertProperty } from "@/lib/properties.functions";
import { draftPayloadToFormInitial } from "@/lib/property-draft";
import { PropertyForm, type PropertyFormValues } from "@/components/admin/property-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/drafts/$draftId")({
  head: () => ({ meta: [{ title: `Edit draft — ${BRAND.name} Admin` }] }),
  component: EditDraftPage,
});

function EditDraftPage() {
  const { draftId } = Route.useParams();
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDraft = useServerFn(getPropertyDraft);
  const saveProperty = useServerFn(upsertProperty);
  const removeDraft = useServerFn(deletePropertyDraft);
  const [draftIdState, setDraftIdState] = useState(draftId);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/adminlogin" });
  }, [loading, isAdmin, navigate]);

  const { data: draft, isLoading, isError } = useQuery({
    queryKey: ["admin-property-draft", draftId],
    queryFn: () => fetchDraft({ data: { id: draftId } }),
    enabled: isAdmin,
  });

  async function handleSave(values: PropertyFormValues) {
    await saveProperty({ data: values });
    await removeDraft({ data: { id: draftIdState } });
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
    qc.invalidateQueries({ queryKey: ["admin-property-drafts"] });
    if (values.is_published) {
      toast.success("Property published — draft removed");
    } else {
      toast.success("Property saved — draft removed");
    }
    navigate({ to: "/admin/properties" });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading draft…
      </div>
    );
  }

  if (isError || !draft) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <p className="font-medium text-slate-900">Draft not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been deleted or already published.</p>
        <Link to="/admin/drafts" className="mt-5 inline-block">
          <Button variant="outline" className="rounded-full">
            Back to drafts
          </Button>
        </Link>
      </div>
    );
  }

  const initial = draftPayloadToFormInitial(draft.payload);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Autosaved draft"
        title={draft.label}
        description="Changes save automatically every few seconds — safe to refresh or switch devices."
        actions={
          <Link to="/admin/drafts">
            <Button variant="outline" className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" /> All drafts
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <PropertyForm
          initial={initial}
          draftId={draftIdState}
          onDraftIdChange={setDraftIdState}
          autosaveEnabled
          onSubmit={handleSave}
          onCancel={() => navigate({ to: "/admin/drafts" })}
        />
      </div>
    </div>
  );
}
