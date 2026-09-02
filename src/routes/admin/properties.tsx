import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListProperties,
  adminGetProperty,
  deleteProperty,
  upsertProperty,
  setPropertyPublished,
  setPropertyFeatured,
} from "@/lib/properties.functions";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ListingBadgesDisplay } from "@/components/listing-badges-display";
import { PropertyForm, type PropertyFormValues } from "@/components/admin/property-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice, propertyTypeLabel } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: () => list(),
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
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
    setCreateOpen(false);
    setEditId(null);
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Inventory" title="Properties" description="Upload images, set map location, publish to the public site." />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full uppercase tracking-wider">
              <Plus className="h-4 w-4" /> Add property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[min(92dvh,92vh)] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New property</DialogTitle>
            </DialogHeader>
            <PropertyForm onSubmit={handleSave} onCancel={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-h-[min(92dvh,92vh)] max-w-3xl overflow-y-auto">
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
              onSubmit={handleSave}
              onCancel={() => setEditId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
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
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No properties yet — add your first listing.</td></tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.city ?? "—"} · {p.view_count} views</div>
                </td>
                <td className="px-4 py-3">{propertyTypeLabel(p.property_type)}</td>
                <td className="px-4 py-3">{formatPrice(Number(p.price), p.currency, p.listing_type)}</td>
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
                        <Button size="icon" variant="ghost" aria-label="View"><ExternalLink className="h-4 w-4" /></Button>
                      </Link>
                    )}
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditId(p.id)}>
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
  );
}
