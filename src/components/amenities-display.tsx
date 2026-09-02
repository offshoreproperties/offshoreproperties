import { Check } from "lucide-react";
import { groupAmenities } from "@/lib/amenities";
import { cn } from "@/lib/utils";

export function AmenitiesDisplay({
  features,
  className,
  compact = false,
}: {
  features: string[];
  className?: string;
  compact?: boolean;
}) {
  const groups = groupAmenities(features);
  if (groups.length === 0) return null;

  if (compact) {
    return (
      <ul className={cn("flex flex-wrap gap-1", className)}>
        {features.slice(0, 4).map((f) => (
          <li
            key={f}
            className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 sm:text-[11px]"
          >
            {f}
          </li>
        ))}
        {features.length > 4 && (
          <li className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 sm:text-[11px]">
            +{features.length - 4}
          </li>
        )}
      </ul>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.id}>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              {group.label}
            </h3>
            <ul className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                >
                  <Check className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
