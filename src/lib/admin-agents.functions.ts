import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";

export const adminListAgents = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("id, name, agency")
      .order("name");
    if (error) throw error;
    return data ?? [];
  });
