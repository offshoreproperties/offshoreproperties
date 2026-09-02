import { cn } from "@/lib/utils";

export function PropertySection({
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PropertyStatStrip({
  items,
}: {
  items: { icon: React.ReactNode; label: string; value: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-flow-col sm:auto-cols-fr">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 px-3 py-3 text-center sm:py-4">
          <span className="text-slate-400">{item.icon}</span>
          <span className="text-sm font-semibold text-slate-900">{item.value}</span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
