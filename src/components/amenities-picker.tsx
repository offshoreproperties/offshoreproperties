import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import {
  ALL_PRESET_AMENITIES,
  AMENITY_CATEGORIES,
  normalizeAmenityKey,
  sortAmenities,
} from "@/lib/amenities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AmenitiesPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  const selected = useMemo(() => new Set(value.map(normalizeAmenityKey)), [value]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AMENITY_CATEGORIES;
    return AMENITY_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  function toggle(item: string) {
    const key = normalizeAmenityKey(item);
    if (selected.has(key)) {
      onChange(value.filter((v) => normalizeAmenityKey(v) !== key));
    } else {
      onChange(sortAmenities([...value, item]));
    }
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (!trimmed) return;
    const key = normalizeAmenityKey(trimmed);
    if (selected.has(key)) {
      setCustom("");
      return;
    }
    onChange(sortAmenities([...value, trimmed]));
    setCustom("");
  }

  function remove(item: string) {
    const key = normalizeAmenityKey(item);
    onChange(value.filter((v) => normalizeAmenityKey(v) !== key));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="text-base">Amenities &amp; features</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Select from {ALL_PRESET_AMENITIES.length}+ presets or add your own. Selected: {value.length}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search amenities…"
            className="pl-9"
          />
        </div>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background p-3">
          {value.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => remove(item)}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
            >
              {item}
              <X className="h-3 w-3 opacity-70" aria-hidden />
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[min(52vh,520px)] space-y-5 overflow-y-auto pr-1">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <section key={cat.id}>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {cat.label}
              </h4>
              <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 lg:grid-cols-3">
                {cat.items.map((item) => {
                  const active = selected.has(normalizeAmenityKey(item));
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      className={cn(
                        "flex min-h-[40px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition sm:text-sm",
                        active
                          ? "border-blue-300 bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                          : "border-border bg-background text-foreground hover:border-neutral-300 hover:bg-muted/40",
                      )}
                    >
                      <span>{item}</span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add custom amenity (e.g. Lake Naivasha view)"
          maxLength={60}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addCustom} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add custom
        </Button>
      </div>
    </div>
  );
}
