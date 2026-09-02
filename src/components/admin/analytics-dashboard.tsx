import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Building2,
  Calendar,
  Eye,
  Globe,
  Heart,
  Inbox,
  Bookmark,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { adminAnalytics } from "@/lib/analytics.functions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Period = 7 | 30 | 90;

const periodOptions: { value: Period; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const trafficChartConfig = {
  visits: { label: "Site visits", color: "#2563eb" },
  views: { label: "Property views", color: "#059669" },
};

const propertyChartConfig = {
  views: { label: "Views", color: "#2563eb" },
};

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-KE").format(n);
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg bg-blue-50 p-2.5 ring-1 ring-blue-100">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        {href ? <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-blue-500" /> : null}
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {sub ? <p className="mt-2 text-xs text-slate-400">{sub}</p> : null}
    </>
  );

  const className =
    "group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md";

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>(30);
  const fetchAnalytics = useServerFn(adminAnalytics);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-analytics", period],
    queryFn: () => fetchAnalytics({ data: { days: period } }),
  });

  const trafficData =
    data?.charts.siteVisitsByDay.map((row, i) => ({
      label: row.label,
      visits: row.count,
      views: data.charts.propertyViewsByDay[i]?.count ?? 0,
    })) ?? [];

  const propertyChartData =
    data?.topProperties.map((p) => ({
      name: p.title.length > 22 ? `${p.title.slice(0, 22)}…` : p.title,
      views: p.viewsInPeriod,
      fullTitle: p.title,
    })) ?? [];

  const hasTraffic = trafficData.some((d) => d.visits > 0 || d.views > 0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Performance overview"
        description="Site traffic, property engagement, leads, and viewing requests in one place."
        actions={
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
            {periodOptions.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={period === opt.value ? "default" : "outline"}
                className={cn(
                  "h-10 rounded-lg px-2 font-medium sm:h-9 sm:px-4",
                  period === opt.value
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            {isFetching && !isLoading ? (
              <span className="col-span-3 text-center text-xs text-slate-500 sm:col-span-1 sm:text-left">
                Updating…
              </span>
            ) : null}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={`Site visits (${period}d)`}
              value={formatNumber(data.totals.siteVisitsInPeriod)}
              sub={`${formatNumber(data.totals.siteVisitsAllTime)} all time`}
              icon={Globe}
            />
            <StatCard
              label={`Property views (${period}d)`}
              value={formatNumber(data.totals.propertyViewsInPeriod)}
              sub={`${formatNumber(data.totals.propertyViewsAllTime)} all time`}
              icon={Eye}
              href="/admin/properties"
            />
            <StatCard
              label={`Likes (${period}d)`}
              value={formatNumber(data.totals.likesInPeriod)}
              sub={`${formatNumber(data.totals.likesAllTime)} all time`}
              icon={Heart}
            />
            <StatCard
              label={`Saves (${period}d)`}
              value={formatNumber(data.totals.savesInPeriod)}
              sub={`${formatNumber(data.totals.savesAllTime)} all time`}
              icon={Bookmark}
            />
            <StatCard
              label="Published listings"
              value={formatNumber(data.totals.publishedListings)}
              sub={`${formatNumber(data.totals.draftListings)} drafts`}
              icon={Building2}
              href="/admin/properties"
            />
            <StatCard
              label={`New leads (${period}d)`}
              value={formatNumber(data.totals.leadsInPeriod)}
              sub={`${formatNumber(data.leadByStatus.new)} awaiting reply`}
              icon={Inbox}
              href="/admin/leads"
            />
            <StatCard
              label={`Viewing requests (${period}d)`}
              value={formatNumber(data.totals.bookingsInPeriod)}
              sub={`${formatNumber(data.bookingByStatus.pending)} pending`}
              icon={Calendar}
              href="/admin/bookings"
            />
            <StatCard
              label="Engagement score"
              value={formatNumber(
                data.totals.propertyViewsInPeriod +
                  data.totals.likesInPeriod * 3 +
                  data.totals.savesInPeriod * 5,
              )}
              sub="Views + weighted likes & saves"
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-slate-900">Traffic trend</h3>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600" /> Site visits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" /> Property views
                  </span>
                </div>
              </div>
              {hasTraffic ? (
                <ChartContainer config={trafficChartConfig} className="aspect-[2.4/1] w-full min-h-[220px]">
                  <AreaChart data={trafficData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#64748b" />
                    <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} allowDecimals={false} stroke="#64748b" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="var(--color-visits)"
                      fill="var(--color-visits)"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="var(--color-views)"
                      fill="var(--color-views)"
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                  <BarChart3 className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No traffic data yet</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">
                    Charts fill in as visitors browse the site and view listings.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Lead pipeline</h3>
              <p className="mt-1 text-sm text-slate-500">Status breakdown for the selected period</p>
              <div className="mt-6 space-y-3">
                {[
                  { label: "New", value: data.leadByStatus.new, tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
                  { label: "Contacted", value: data.leadByStatus.contacted, tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
                  { label: "Closed", value: data.leadByStatus.closed, tone: "bg-muted text-muted-foreground" },
                  { label: "Other", value: data.leadByStatus.other, tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-medium text-slate-700">{row.label}</span>
                    <Badge variant="secondary" className={cn("font-mono", row.tone)}>
                      {row.value}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-slate-800">Viewing requests</h4>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Pending</p>
                    <p className="text-xl font-bold text-slate-900">{data.bookingByStatus.pending}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Confirmed</p>
                    <p className="text-xl font-bold text-slate-900">{data.bookingByStatus.confirmed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Top properties by views</h3>
              <p className="mt-1 text-sm text-slate-500">Most viewed listings in the last {period} days</p>
              {propertyChartData.length ? (
                <ChartContainer config={propertyChartConfig} className="mt-6 aspect-[1.6/1] w-full">
                  <BarChart data={propertyChartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/60" />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={108} fontSize={10} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as { fullTitle?: string } | undefined)?.fullTitle ?? ""
                          }
                        />
                      }
                    />
                    <Bar dataKey="views" fill="var(--color-views)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="mt-8 text-sm text-slate-500">No property views recorded in this period yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Top pages</h3>
              <p className="mt-1 text-sm text-slate-500">Most visited routes on the public site</p>
              <div className="mt-4 divide-y divide-border">
                {data.topPages.length ? (
                  data.topPages.map((page) => (
                    <div key={page.path} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <code className="truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{page.path}</code>
                      <span className="shrink-0 font-mono text-sm text-slate-600">{formatNumber(page.count)}</span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">
                    Page visits will appear here once site tracking collects data.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">All properties — engagement</h3>
              <p className="mt-1 text-sm text-slate-500">
                Views, likes, and saves per listing for the last {period} days
              </p>
            </div>
            <div className="hidden scrollbar-offshore overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-medium">Property</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Views ({period}d)</th>
                    <th className="px-3 py-3 text-right font-medium">All-time views</th>
                    <th className="px-3 py-3 text-right font-medium">Likes</th>
                    <th className="px-3 py-3 text-right font-medium">Saves</th>
                    <th className="px-3 py-3 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.propertyStats.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.heroImage ? (
                            <img src={p.heroImage} alt="" className="h-10 w-14 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-14 rounded bg-muted" />
                          )}
                          <div className="min-w-0">
                            {p.slug ? (
                              <Link
                                to="/properties/$slug"
                                params={{ slug: p.slug }}
                                className="truncate font-medium text-slate-900 hover:text-blue-600"
                                target="_blank"
                              >
                                {p.title}
                              </Link>
                            ) : (
                              <p className="truncate font-medium text-foreground">{p.title}</p>
                            )}
                            <p className="truncate text-xs text-muted-foreground">{p.city ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={p.isPublished ? "default" : "secondary"}>
                          {p.isPublished ? "Live" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-mono">{formatNumber(p.viewsInPeriod)}</td>
                      <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                        {formatNumber(p.viewsAllTime)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">{formatNumber(p.likesInPeriod)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatNumber(p.savesInPeriod)}</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-600">{formatNumber(p.engagementScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {data.propertyStats.map((p) => (
                <div key={p.id} className="flex gap-3 px-4 py-3">
                  {p.heroImage ? (
                    <img src={p.heroImage} alt="" className="h-14 w-16 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-14 w-16 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    {p.slug ? (
                      <Link
                        to="/properties/$slug"
                        params={{ slug: p.slug }}
                        className="line-clamp-2 font-medium text-slate-900 hover:text-blue-600"
                        target="_blank"
                      >
                        {p.title}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 font-medium text-foreground">{p.title}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={p.isPublished ? "default" : "secondary"} className="text-[10px]">
                        {p.isPublished ? "Live" : "Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{p.city ?? "—"}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span>
                        <span className="text-muted-foreground">Views ({period}d): </span>
                        <span className="font-mono font-medium">{formatNumber(p.viewsInPeriod)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Likes: </span>
                        <span className="font-mono font-medium">{formatNumber(p.likesInPeriod)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Saves: </span>
                        <span className="font-mono font-medium">{formatNumber(p.savesInPeriod)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Score: </span>
                        <span className="font-mono font-medium text-blue-600">{formatNumber(p.engagementScore)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Recent enquiries</h3>
                <Link to="/admin/leads" className="text-xs font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentLeads.length ? (
                  data.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium capitalize text-slate-800">{lead.source.replace("_", " ")}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(lead.created_at).toLocaleString("en-KE")}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {lead.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No enquiries in this period.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Recent viewing requests</h3>
                <Link to="/admin/bookings" className="text-xs font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentBookings.length ? (
                  data.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {new Date(booking.requested_at).toLocaleString("en-KE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(booking.created_at).toLocaleDateString("en-KE")}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {booking.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No viewing requests in this period.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
