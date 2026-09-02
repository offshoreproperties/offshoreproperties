import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBookings, adminUpdateBooking } from "@/lib/properties.functions";
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

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: `Bookings — ${BRAND.name} Admin` }] }),
  component: AdminBookings,
});

const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

function AdminBookings() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(adminListBookings);
  const update = useServerFn(adminUpdateBooking);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-bookings"],
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
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking updated");
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Calendar"
        title="Viewings"
        description="Scheduled property viewings and tours."
      />
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">No bookings yet.</p>
        )}
        {rows.map((b) => (
          <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{b.client_name}</p>
                <p className="text-sm text-slate-500">{b.client_email}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {new Date(b.requested_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {b.properties && (
                  <p className="mt-1 text-xs font-medium text-blue-600">
                    {(b.properties as { title: string }).title}
                  </p>
                )}
              </div>
              <Select
                value={b.status}
                onValueChange={(status) => patch.mutate({ id: b.id, status })}
              >
                <SelectTrigger className="w-full max-w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {b.notes && <p className="mt-3 text-sm text-slate-600">{b.notes}</p>}
            <Badge variant="outline" className="mt-3">{b.duration_minutes} min</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
