import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  adminListProperties,
  adminGetProperty,
  deleteProperty,
  upsertProperty,
  setPropertyPublished,
  setPropertyFeatured,
} from "@/lib/properties.functions";
import { deletePropertyDraft, listPropertyDrafts } from "@/lib/property-drafts.functions";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { ListingBadgesDisplay } from "@/components/listing-badges-display";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PropertyForm, type PropertyFormValues } from "@/components/admin/property-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, propertyTypeLabel } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, FileText } from "lucide-react";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/admin/properties")({
  head: () => ({ meta: [{ title: `Properties — ${BRAND.name} Admin` }] }),
  component: AdminProperties,
});

function AdminProperties() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(adminListProperties);
  const getOne = useServerFn(adminGetProperty);
  const remove = useServerFn(deleteProperty);
  const save = useServerFn(upsertProperty);
  const publish = useServerFn(setPropertyPublished);
  const feature = useServerFn(setPropertyFeatured);
  const listDrafts = useServerFn(listPropertyDrafts);
  const removeDraft = useServerFn(deletePropertyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraftId, setEditDraftId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: () => list(),
    enabled: isAdmin,
  });

  const { data: draftRows = [] } = useQuery({
    queryKey: ["admin-property-drafts"],
    queryFn: () => listDrafts(),
    enabled: isAdmin,
  });

  const { data: editing } = useQuery({
    queryKey: ["admin-property", editId],
    queryFn: () => getOne({ data: { id: editId! } }),
    enabled: !!editId && isAdmin,
  });

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/adminlogin" });
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!editId) setEditDraftId(null);
  }, [editId]);

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success("Property removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      publish({ data: { id, is_published } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success(row.is_published ? "Property is now live on the public site" : "Property unpublished (draft)");
    },
    onError: (e) => toast.error(e.message),
  });

  const featureMut = useMutation({
    mutationFn: ({ id, is_featured }: { id: string; is_featured: boolean }) =>
      feature({ data: { id, is_featured } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success(row.is_featured ? "Property featured" : "Property unfeatured");
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleSave(values: PropertyFormValues) {
    await save({ data: values });
    if (editDraftId) {
      await removeDraft({ data: { id: editDraftId } });
      qc.invalidateQueries({ queryKey: ["admin-property-drafts"] });
    }
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
    setEditId(null);
    setEditDraftId(null);
    if (values.is_published) {
      toast.success("Property saved and published — visible on the public site");
    } else {
      toast.message("Saved as draft", {
        description: "Turn on “Published” or click Publish in the table to show it on the site.",
      });
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Inventory"
        title="Properties"
        description="Upload images, set map location, and publish listings to the public site."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/drafts">
              <Button variant="outline" className="gap-2 rounded-full">
                <FileText className="h-4 w-4" />
                Drafts{draftRows.length > 0 ? ` (${draftRows.length})` : ""}
              </Button>
            </Link>
            <Link to="/admin/drafts/new">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Add property
              </Button>
            </Link>
          </div>
        }
      />

      {draftRows.length > 0 && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          You have {draftRows.length} autosaved draft{draftRows.length === 1 ? "" : "s"} —{" "}
          <Link to="/admin/drafts" className="font-semibold underline underline-offset-2">
            continue where you left off
          </Link>
          , even on another device.
        </div>
      )}

      <Dialog
        open={!!editId}
        onOpenChange={(o) => {
          if (!o) {
            setEditId(null);
            setEditDraftId(null);
          }
        }}
      >
        <DialogContent
          className={
            isMobile
              ? "scrollbar-offshore fixed inset-0 left-0 top-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none border-0 p-4 sm:p-5"
              : "scrollbar-offshore max-h-[min(92dvh,92vh)] max-w-3xl overflow-y-auto"
          }
        >
          <DialogHeader>
            <DialogTitle>Edit property</DialogTitle>
          </DialogHeader>
          {editing && (
            <PropertyForm
              initial={{
                ...editing,
                images: editing.images ?? [],
                features: editing.features ?? [],
                listing_badges: editing.listing_badges ?? [],
              }}
              draftId={editDraftId}
              onDraftIdChange={setEditDraftId}
              autosaveEnabled
              onSubmit={handleSave}
              onCancel={() => {
                setEditId(null);
                setEditDraftId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-3 md:hidden">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading…
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No properties yet —{" "}
            <Link to="/admin/drafts/new" className="font-medium text-blue-600 underline">
              start a draft
            </Link>
            .
          </div>
        )}
        {rows.map((p) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.city ?? "—"} · {propertyTypeLabel(p.property_type)} · {p.view_count} views
                  </p>
                </div>
                <Badge variant={p.is_published ? "default" : "secondary"}>
                  {p.is_published ? "Live" : "Draft"}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-blue-600">
                {formatPrice(Number(p.price), p.currency, p.listing_type)}
              </p>
              <div className="mt-2">
                <ListingBadgesDisplay
                  badges={p.listing_badges}
                  isFeatured={p.is_featured}
                  limit={3}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {!p.is_published ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-full text-xs"
                  disabled={publishMut.isPending}
                  onClick={() => publishMut.mutate({ id: p.id, is_published: true })}
                >
                  Publish
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 rounded-full text-xs"
                  disabled={publishMut.isPending}
                  onClick={() => publishMut.mutate({ id: p.id, is_published: false })}
                >
                  Unpublish
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-10 rounded-full text-xs"
                disabled={featureMut.isPending}
                onClick={() => featureMut.mutate({ id: p.id, is_featured: !p.is_featured })}
              >
                {p.is_featured ? "Unfeature" : "Feature"}
              </Button>
              {p.is_published && p.slug && (
                <Link to="/properties/$slug" params={{ slug: p.slug }} target="_blank">
                  <Button size="sm" variant="outline" className="h-10 gap-1.5 rounded-full text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-slate-100 bg-slate-100">
              <Button
                variant="ghost"
                className="h-12 rounded-none bg-white text-sm"
                onClick={() => setEditId(p.id)}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              {p.is_published && p.slug ? (
                <Link
                  to="/properties/$slug"
                  params={{ slug: p.slug }}
                  target="_blank"
                  className="inline-flex h-12 items-center justify-center bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open
                </Link>
              ) : (
                <div className="flex h-12 items-center justify-center bg-white text-xs text-slate-400">—</div>
              )}
              <Button
                variant="ghost"
                className="h-12 rounded-none bg-white text-sm text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this property?")) del.mutate(p.id);
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="scrollbar-offshore overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Map</th>
                <th className="px-4 py-3">Badges</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No properties yet —{" "}
                    <Link to="/admin/drafts/new" className="font-medium text-blue-600 underline">
                      start a draft
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">
                      {p.city ?? "—"} · {p.view_count} views
                    </div>
                  </td>
                  <td className="px-4 py-3">{propertyTypeLabel(p.property_type)}</td>
                  <td className="px-4 py-3">
                    {formatPrice(Number(p.price), p.currency, p.listing_type)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.latitude != null ? "default" : "secondary"} className="text-xs">
                      {p.latitude != null ? "On map" : "No coords"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[220px] flex-col items-start gap-1.5">
                      <ListingBadgesDisplay
                        badges={p.listing_badges}
                        isFeatured={p.is_featured}
                        limit={3}
                        size="sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full text-xs"
                        disabled={featureMut.isPending}
                        onClick={() => featureMut.mutate({ id: p.id, is_featured: !p.is_featured })}
                      >
                        {p.is_featured ? "Unfeature" : "Feature"}
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <Badge variant={p.is_published ? "default" : "secondary"}>
                        {p.is_published ? "Live" : "Draft"}
                      </Badge>
                      {!p.is_published && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full text-xs"
                          disabled={publishMut.isPending}
                          onClick={() => publishMut.mutate({ id: p.id, is_published: true })}
                        >
                          Publish
                        </Button>
                      )}
                      {p.is_published && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full text-xs text-muted-foreground"
                          disabled={publishMut.isPending}
                          onClick={() => publishMut.mutate({ id: p.id, is_published: false })}
                        >
                          Unpublish
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.is_published && p.slug && (
                        <Link to="/properties/$slug" params={{ slug: p.slug }} target="_blank">
                          <Button size="icon" variant="ghost" aria-label="View">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11"
                        aria-label="Edit"
                        onClick={() => setEditId(p.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete"
                        onClick={() => {
                          if (confirm("Delete this property?")) del.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
