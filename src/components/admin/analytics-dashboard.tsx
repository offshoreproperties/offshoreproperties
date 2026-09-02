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
import { SectionHeading } from "@/components/section-heading";
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
  visits: { label: "Site visits", color: "hsl(var(--chart-1))" },
  views: { label: "Property views", color: "hsl(var(--chart-2))" },
};

const propertyChartConfig = {
  views: { label: "Views", color: "hsl(var(--chart-1))" },
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
        <div className="rounded-lg bg-brass/10 p-2.5">
          <Icon className="h-4 w-4 text-brass" />
        </div>
        {href ? <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" /> : null}
      </div>
      <p className="mt-4 font-display text-3xl text-foreground">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub ? <p className="mt-2 text-xs text-muted-foreground/80">{sub}</p> : null}
    </>
  );

  const className =
    "rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elevated";

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

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Analytics"
          title="Performance overview"
          description="Site traffic, property engagement, leads, and viewing requests in one place."
        />
        <div className="flex flex-wrap items-center gap-2">
          {periodOptions.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={period === opt.value ? "default" : "outline"}
              className={cn("h-9", period === opt.value && "bg-brass text-brass-foreground hover:bg-brass/90")}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          {isFetching && !isLoading ? (
            <span className="text-xs text-muted-foreground">Updating…</span>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-muted/40" />
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
            <div className="rounded-xl border border-border bg-card p-5 shadow-card xl:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brass" />
                <h3 className="font-display text-lg text-foreground">Traffic trend</h3>
              </div>
              <ChartContainer config={trafficChartConfig} className="aspect-[2.4/1] w-full">
                <AreaChart data={trafficData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--color-visits)"
                    fill="var(--color-visits)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-views)"
                    fill="var(--color-views)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg text-foreground">Lead pipeline</h3>
              <p className="mt-1 text-sm text-muted-foreground">Status breakdown for the selected period</p>
              <div className="mt-6 space-y-3">
                {[
                  { label: "New", value: data.leadByStatus.new, tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
                  { label: "Contacted", value: data.leadByStatus.contacted, tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
                  { label: "Closed", value: data.leadByStatus.closed, tone: "bg-muted text-muted-foreground" },
                  { label: "Other", value: data.leadByStatus.other, tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                    <span className="text-sm text-foreground">{row.label}</span>
                    <Badge variant="secondary" className={cn("font-mono", row.tone)}>
                      {row.value}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-medium text-foreground">Viewing requests</h4>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="font-display text-xl">{data.bookingByStatus.pending}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                    <p className="font-display text-xl">{data.bookingByStatus.confirmed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg text-foreground">Top properties by views</h3>
              <p className="mt-1 text-sm text-muted-foreground">Most viewed listings in the last {period} days</p>
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
                <p className="mt-8 text-sm text-muted-foreground">No property views recorded in this period yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg text-foreground">Top pages</h3>
              <p className="mt-1 text-sm text-muted-foreground">Most visited routes on the public site</p>
              <div className="mt-4 divide-y divide-border">
                {data.topPages.length ? (
                  data.topPages.map((page) => (
                    <div key={page.path} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <code className="truncate rounded bg-muted px-2 py-1 text-xs text-foreground">{page.path}</code>
                      <span className="shrink-0 font-mono text-muted-foreground">{formatNumber(page.count)}</span>
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

          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-display text-lg text-foreground">All properties — engagement</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Views, likes, and saves per listing for the last {period} days
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
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
                    <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
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
                                className="truncate font-medium text-foreground hover:text-brass"
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
                      <td className="px-3 py-3 text-right font-mono text-brass">{formatNumber(p.engagementScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">Recent enquiries</h3>
                <Link to="/admin/leads" className="text-xs uppercase tracking-wider text-brass hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentLeads.length ? (
                  data.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium capitalize text-foreground">{lead.source.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
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

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">Recent viewing requests</h3>
                <Link to="/admin/bookings" className="text-xs uppercase tracking-wider text-brass hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentBookings.length ? (
                  data.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
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
