import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListLeads, adminUpdateLead } from "@/lib/properties.functions";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BRAND } from "@/lib/constants";
import { statusLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: `Leads — ${BRAND.name} Admin` }] }),
  component: AdminLeads,
});

const STATUSES = ["new", "contacted", "viewing_scheduled", "offer_made", "closed_won", "closed_lost"] as const;

function AdminLeads() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(adminListLeads);
  const update = useServerFn(adminUpdateLead);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => list(),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/adminlogin" });
  }, [loading, isAdmin, navigate]);

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      update({ data: { id, status: status as (typeof STATUSES)[number] } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead updated");
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM"
        title="Leads"
        description="Enquiries from the website and property pages."
      />
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">No leads yet.</p>
        )}
        {rows.map((l) => (
          <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{l.client_name}</p>
                <p className="text-sm text-slate-500">{l.client_email}</p>
                {l.properties && (
                  <p className="mt-1 text-xs font-medium text-blue-600">
                    Re: {(l.properties as { title: string }).title}
                  </p>
                )}
              </div>
              <Select
                value={l.status}
                onValueChange={(status) => patch.mutate({ id: l.id, status })}
              >
                <SelectTrigger className="w-full max-w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {l.message && <p className="mt-3 text-sm text-slate-600">{l.message}</p>}
            <div className="mt-3 flex gap-2">
              <Badge variant="outline">{l.source}</Badge>
              <span className="text-xs text-slate-400">
                {new Date(l.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
