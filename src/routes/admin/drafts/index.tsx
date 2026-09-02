import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { listPropertyDrafts, deletePropertyDraft } from "@/lib/property-drafts.functions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin/drafts/")({
  head: () => ({ meta: [{ title: `Drafts — ${BRAND.name} Admin` }] }),
  component: AdminDraftsPage,
});

function AdminDraftsPage() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listPropertyDrafts);
  const remove = useServerFn(deletePropertyDraft);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/adminlogin" });
  }, [loading, isAdmin, navigate]);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["admin-property-drafts"],
    queryFn: () => list(),
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-property-drafts"] });
      toast.success("Draft deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Autosaved work"
        title="Drafts"
        description="Every listing you start is saved here automatically — continue on any device, even after refresh."
        actions={
          <Link to="/admin/drafts/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New draft
            </Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading drafts…</p>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <FileText className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-800">No drafts yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Start a new listing — your progress saves automatically every few seconds.
            </p>
            <Link to="/admin/drafts/new" className="mt-5">
              <Button className="rounded-full">Start a draft</Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {drafts.map((draft) => {
              const photoCount = draft.payload.images?.length ?? 0;
              const city = draft.payload.city?.trim();
              return (
                <li
                  key={draft.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{draft.label}</p>
                      {draft.property_id && (
                        <Badge variant="secondary" className="text-[10px]">
                          Editing existing
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {city ? `${city} · ` : ""}
                      {photoCount} photo{photoCount === 1 ? "" : "s"} · Updated{" "}
                      {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link to="/admin/drafts/$draftId" params={{ draftId: draft.id }}>
                      <Button size="sm" className="gap-1.5 rounded-full">
                        <Pencil className="h-3.5 w-3.5" /> Continue
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this draft? This cannot be undone.")) {
                          del.mutate(draft.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
