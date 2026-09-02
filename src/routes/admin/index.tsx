import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: `Analytics — ${BRAND.name} Admin` }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/adminlogin" });
  }, [loading, isAdmin, navigate]);

  if (loading || !isAdmin) return null;

  return <AnalyticsDashboard />;
}
