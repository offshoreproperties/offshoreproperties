import { LISTING_TYPES, PROPERTY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type PropertySearch = {
  q?: string;
  propertyType?: string;
  listingType?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
};

export function PropertyFilters({
  values,
  onChange,
  onReset,
  variant = "light",
}: {
  values: PropertySearch;
  onChange: (patch: Partial<PropertySearch>) => void;
  onReset: () => void;
  variant?: "dark" | "light";
}) {
  const light = variant === "light";
  const shell = light
    ? "border-neutral-200 bg-neutral-50/80"
    : "border-white/10 bg-[#141414]";
  const label = light ? "text-neutral-500" : "text-white/50";
  const field = light
    ? "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400"
    : "border-white/10 bg-[#0a0a0a] text-white placeholder:text-white/35";
  const resetBtn = light
    ? "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
    : "border-white/15 text-white hover:bg-white/10";

  return (
    <div className={cn("grid gap-3 rounded-2xl border p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-4 xl:grid-cols-6", shell)}>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className={cn("text-xs uppercase tracking-wider", label)}>Search</Label>
        <Input
          placeholder="Title, city, keywords…"
          value={values.q ?? ""}
          onChange={(e) => onChange({ q: e.target.value })}
          className={field}
        />
      </div>
      <div className="space-y-1.5">
        <Label className={cn("text-xs uppercase tracking-wider", label)}>Type</Label>
        <Select value={values.propertyType ?? "any"} onValueChange={(v) => onChange({ propertyType: v })}>
          <SelectTrigger className={field}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className={cn("text-xs uppercase tracking-wider", label)}>Listing</Label>
        <Select value={values.listingType ?? "any"} onValueChange={(v) => onChange({ listingType: v })}>
          <SelectTrigger className={field}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LISTING_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className={cn("text-xs uppercase tracking-wider", label)}>City</Label>
        <Input
          placeholder="Any city"
          value={values.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value })}
          className={field}
        />
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 w-full rounded-full", resetBtn)}
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
