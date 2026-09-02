import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import {
  KES_PRICE_OPTIONS,
  KES_RENT_PRICE_OPTIONS,
  PROPERTY_TYPES,
} from "@/lib/constants";
import { KENYA_BROWSE_LOCATIONS } from "@/lib/kenya-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CUSTOM_LOCATION = "__custom__";

type HavenlySearchProps = {
  listingType?: "sale" | "rent";
};

export function HavenlySearch({ listingType }: HavenlySearchProps) {
  const navigate = useNavigate();
  const isRent = listingType === "rent";

  const [areaId, setAreaId] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("any");

  const priceOptions = isRent ? KES_RENT_PRICE_OPTIONS : KES_PRICE_OPTIONS;

  const areasByCity = useMemo(() => {
    const groups = new Map<string, typeof KENYA_BROWSE_LOCATIONS>();
    for (const area of KENYA_BROWSE_LOCATIONS) {
      const list = groups.get(area.city) ?? [];
      list.push(area);
      groups.set(area.city, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  useEffect(() => {
    setMaxPrice("");
  }, [listingType]);

  function resolvedLocation(): string {
    if (areaId === CUSTOM_LOCATION) return customLocation.trim();
    if (!areaId) return "";
    return KENYA_BROWSE_LOCATIONS.find((a) => a.id === areaId)?.label ?? "";
  }

  function resetFilters() {
    setAreaId("");
    setCustomLocation("");
    setPropertyType("any");
    setMaxPrice("");
    setBedrooms("any");
  }

  const hasFilters =
    areaId !== "" ||
    customLocation.trim() !== "" ||
    propertyType !== "any" ||
    maxPrice !== "" ||
    bedrooms !== "any";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const location = resolvedLocation();
    navigate({
      to: "/properties",
      search: {
        location: location || undefined,
        city: location || undefined,
        propertyType: propertyType === "any" ? undefined : propertyType,
        listingType: listingType || undefined,
        maxPrice: maxPrice || undefined,
        bedrooms: bedrooms === "any" ? undefined : bedrooms,
      },
    });
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] lg:items-end">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="home-filter-area" className="text-xs font-medium text-slate-600">
            Area
          </Label>
          <Select
            value={areaId || "any"}
            onValueChange={(v) => {
              if (v === "any") {
                setAreaId("");
                setCustomLocation("");
              } else {
                setAreaId(v);
                if (v !== CUSTOM_LOCATION) setCustomLocation("");
              }
            }}
          >
            <SelectTrigger id="home-filter-area" className="h-11 rounded-xl border-slate-200 bg-slate-50/80">
              <SelectValue placeholder="Any area in Kenya" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(60dvh,320px)]">
              <SelectItem value="any">Any area</SelectItem>
              {areasByCity.map(([city, areas]) => (
                <SelectGroup key={city}>
                  <SelectLabel>{city}</SelectLabel>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <SelectItem value={CUSTOM_LOCATION}>Other — type below</SelectItem>
            </SelectContent>
          </Select>
          {areaId === CUSTOM_LOCATION ? (
            <Input
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Neighbourhood or city"
              className="mt-2 h-10 rounded-xl border-slate-200 bg-white"
              autoFocus
            />
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="home-filter-type" className="text-xs font-medium text-slate-600">
            Property type
          </Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger id="home-filter-type" className="h-11 rounded-xl border-slate-200 bg-slate-50/80">
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
          <Label htmlFor="home-filter-price" className="text-xs font-medium text-slate-600">
            {isRent ? "Max rent" : "Max price"}
          </Label>
          <Select value={maxPrice || "any"} onValueChange={(v) => setMaxPrice(v === "any" ? "" : v)}>
            <SelectTrigger id="home-filter-price" className="h-11 rounded-xl border-slate-200 bg-slate-50/80">
              <SelectValue placeholder={isRent ? "Any budget" : "Any price"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{isRent ? "Any budget" : "Any price"}</SelectItem>
              {priceOptions
                .filter((p) => p.value !== "")
                .map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="home-filter-beds" className="text-xs font-medium text-slate-600">
            Bedrooms
          </Label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger id="home-filter-beds" className="h-11 rounded-xl border-slate-200 bg-slate-50/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button
            type="submit"
            size="icon"
            aria-label="Search listings"
            className="h-11 w-11 shrink-0 rounded-xl border border-blue-600/20 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
          >
            <Search className="h-4 w-4" strokeWidth={2.25} />
          </Button>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-11 rounded-xl px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
