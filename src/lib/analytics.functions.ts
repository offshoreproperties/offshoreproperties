import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabaseAnonServer } from "@/integrations/supabase/client.anon-server";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { rateLimit } from "@/lib/rate-limit";

const PeriodSchema = z.object({
  days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
});

type Period = z.infer<typeof PeriodSchema>["days"];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function daysInRange(days: Period): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function countByDay(rows: { created_at: string }[], days: Period) {
  const range = daysInRange(days);
  const counts = new Map(range.map((d) => [d, 0]));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  for (const row of rows) {
    if (row.created_at < since) continue;
    const key = dayKey(row.created_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return range.map((date) => ({
    date,
    label: new Date(`${date}T12:00:00Z`).toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
    count: counts.get(date) ?? 0,
  }));
}

function groupCount<T extends string>(rows: { [K in T]: string }[], key: T) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = row[key];
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export const recordSiteVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        path: z.string().min(1).max(500),
        referrer: z.string().max(2000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    rateLimit("site-visit", 60, 60_000);
    const path = data.path.split("?")[0] ?? "/";
    if (path.startsWith("/admin")) return { ok: true };
    await supabaseAnonServer.from("site_visits").insert({
      path,
      referrer: data.referrer ?? null,
    });
    return { ok: true };
  });

export const adminAnalytics = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => PeriodSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { days } = data;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const [
      propertiesRes,
      viewsRes,
      siteVisitsRes,
      likesRes,
      savesRes,
      leadsRes,
      bookingsRes,
      allSiteVisitsRes,
      allViewsRes,
      allLikesRes,
      allSavesRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("properties")
        .select("id, title, slug, city, hero_image, is_published, view_count, created_at")
        .order("view_count", { ascending: false }),
      supabaseAdmin.from("property_views").select("property_id, created_at").gte("created_at", since),
      supabaseAdmin.from("site_visits").select("path, created_at").gte("created_at", since),
      supabaseAdmin.from("property_likes").select("property_id, created_at").gte("created_at", since),
      supabaseAdmin.from("property_saves").select("property_id, created_at").gte("created_at", since),
      supabaseAdmin.from("leads").select("id, status, source, created_at").gte("created_at", since).order("created_at", { ascending: false }),
      supabaseAdmin
        .from("bookings")
        .select("id, status, requested_at, created_at, property_id")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("site_visits").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("property_views").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("property_likes").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("property_saves").select("*", { count: "exact", head: true }),
    ]);

    const properties = propertiesRes.data ?? [];
    const views = viewsRes.data ?? [];
    const siteVisits = siteVisitsRes.data ?? [];
    const likes = likesRes.data ?? [];
    const saves = savesRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const bookings = bookingsRes.data ?? [];

    const viewsByProperty = groupCount(views, "property_id");
    const likesByProperty = groupCount(likes, "property_id");
    const savesByProperty = groupCount(saves, "property_id");

    const propertyStats = properties.map((p) => {
      const viewsInPeriod = viewsByProperty.get(p.id) ?? 0;
      const likesInPeriod = likesByProperty.get(p.id) ?? 0;
      const savesInPeriod = savesByProperty.get(p.id) ?? 0;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug ?? "",
        city: p.city,
        heroImage: p.hero_image,
        isPublished: p.is_published,
        viewsAllTime: p.view_count ?? 0,
        viewsInPeriod,
        likesInPeriod,
        savesInPeriod,
        engagementScore: viewsInPeriod + likesInPeriod * 3 + savesInPeriod * 5,
      };
    });

    const topProperties = [...propertyStats]
      .sort((a, b) => b.viewsInPeriod - a.viewsInPeriod || b.viewsAllTime - a.viewsAllTime)
      .slice(0, 10);

    const pathCounts = new Map<string, number>();
    for (const visit of siteVisits) {
      pathCounts.set(visit.path, (pathCounts.get(visit.path) ?? 0) + 1);
    }
    const topPages = [...pathCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([path, count]) => ({ path, count }));

    const leadByStatus = {
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      closed: leads.filter((l) => l.status === "closed").length,
      other: leads.filter((l) => !["new", "contacted", "closed"].includes(l.status)).length,
    };

    const bookingByStatus = {
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };

    return {
      period: days,
      totals: {
        siteVisitsInPeriod: siteVisits.length,
        propertyViewsInPeriod: views.length,
        likesInPeriod: likes.length,
        savesInPeriod: saves.length,
        leadsInPeriod: leads.length,
        bookingsInPeriod: bookings.length,
        siteVisitsAllTime: allSiteVisitsRes.count ?? 0,
        propertyViewsAllTime: allViewsRes.count ?? 0,
        likesAllTime: allLikesRes.count ?? 0,
        savesAllTime: allSavesRes.count ?? 0,
        publishedListings: properties.filter((p) => p.is_published).length,
        draftListings: properties.filter((p) => !p.is_published).length,
      },
      charts: {
        siteVisitsByDay: countByDay(siteVisits, days),
        propertyViewsByDay: countByDay(views, days),
        leadsByDay: countByDay(leads, days),
      },
      topProperties,
      propertyStats: propertyStats.sort((a, b) => b.viewsInPeriod - a.viewsInPeriod),
      topPages,
      leadByStatus,
      bookingByStatus,
      recentLeads: leads.slice(0, 8),
      recentBookings: bookings.slice(0, 8),
    };
  });
