import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown } from "lucide-react";
import { PROPERTY_TYPES, KES_PRICE_OPTIONS } from "@/lib/constants";
import { KENYA_BROWSE_LOCATIONS } from "@/lib/kenya-locations";

export function HavenlySearch({ listingType }: { listingType?: "sale" | "rent" }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [maxPrice, setMaxPrice] = useState("5000000");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: {
        location: location || undefined,
        city: location || undefined,
        propertyType: propertyType === "any" ? undefined : propertyType,
        listingType: listingType || undefined,
        maxPrice: maxPrice || undefined,
      },
    });
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full flex-col gap-0 overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md sm:flex-row sm:items-stretch sm:rounded-full sm:pr-2"
    >
      <div className="flex flex-1 flex-col divide-y divide-neutral-200 sm:flex-row sm:divide-x sm:divide-y-0">
        <label className="group flex flex-1 cursor-text flex-col px-4 py-2.5 sm:px-5 sm:py-2.5">
          <span className="text-[11px] font-medium text-neutral-500 sm:text-xs">Location</span>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kilimani, Karen, Westlands…"
              list="hero-location-options"
              className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            <datalist id="hero-location-options">
              {KENYA_BROWSE_LOCATIONS.map((area) => (
                <option key={area.id} value={area.label}>
                  {area.city}
                </option>
              ))}
            </datalist>
          </div>
        </label>

        <label className="relative flex flex-1 flex-col px-4 py-2.5 sm:px-5 sm:py-2.5">
          <span className="text-[11px] font-medium text-neutral-500 sm:text-xs">Property type</span>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full appearance-none bg-transparent text-neutral-900 focus:outline-none"
            >
              <option value="apartment" className="bg-white">Penthouse</option>
              {PROPERTY_TYPES.filter((t) => t.value !== "any" && t.value !== "apartment").map((t) => (
                <option key={t.value} value={t.value} className="bg-white">
                  {t.label.replace(/s$/, "")}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
          </div>
        </label>

        <label className="relative flex flex-1 flex-col px-4 py-2.5 sm:px-5 sm:py-2.5">
          <span className="text-[11px] font-medium text-neutral-500 sm:text-xs">Max price</span>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full appearance-none bg-transparent font-medium text-blue-600 focus:outline-none"
            >
              {KES_PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value} className="bg-white text-neutral-900">
                  {p.label === "Any price" ? "No max" : p.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
          </div>
        </label>
      </div>

      <button
        type="submit"
        aria-label="Search"
        className="mx-3 mb-3 flex h-12 w-[calc(100%-1.5rem)] items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 sm:m-1.5 sm:h-11 sm:w-11 sm:shrink-0"
      >
        <Search className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </form>
  );
}
