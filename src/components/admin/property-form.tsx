import { useState, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { uploadPropertyImage } from "@/lib/storage.functions";
import { geocodeAddress } from "@/lib/geocode.functions";
import { adminListAgents } from "@/lib/properties.functions";
import { slugify } from "@/lib/format";
import { getGoogleMapsApiKey, googleMapsConfigError } from "@/lib/google-maps";
import { PROPERTY_TYPES, LISTING_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, MapPin, Upload, X, GripVertical } from "lucide-react";

export type PropertyFormValues = {
  id?: string;
  title: string;
  slug: string;
  property_type: string;
  listing_type: string;
  status: string;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  plot_size_sqm: number | null;
  year_built: number | null;
  furnishing_status: string | null;
  parking_spaces: number | null;
  short_let_min_nights: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  features: string[];
  images: string[];
  hero_image: string | null;
  is_published: boolean;
  is_featured: boolean;
  agent_id: string | null;
  available_from: string | null;
};

type Initial = Partial<PropertyFormValues> & { id?: string };

const FURNISHING_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

export function PropertyForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Initial;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const upload = useServerFn(uploadPropertyImage);
  const geocode = useServerFn(geocodeAddress);
  const fetchAgents = useServerFn(adminListAgents);

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => fetchAgents(),
  });

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? "villa");
  const [listingType, setListingType] = useState(initial?.listing_type ?? "sale");
  const [status, setStatus] = useState(initial?.status ?? "available");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [bedrooms, setBedrooms] = useState(String(initial?.bedrooms ?? ""));
  const [bathrooms, setBathrooms] = useState(String(initial?.bathrooms ?? ""));
  const sqmToAcres = (sqm: number) => sqm / 4046.86;
  const acresToSqm = (acres: number) => acres * 4046.86;

  const initArea = initial?.area_sqm != null && initial.property_type === "land"
    ? String(parseFloat(sqmToAcres(Number(initial.area_sqm)).toFixed(4)))
    : String(initial?.area_sqm ?? "");
  const initPlot = initial?.plot_size_sqm != null && initial.property_type === "land"
    ? String(parseFloat(sqmToAcres(Number(initial.plot_size_sqm)).toFixed(4)))
    : String(initial?.plot_size_sqm ?? "");

  const [areaSqm, setAreaSqm] = useState(initArea);
  const [plotSizeSqm, setPlotSizeSqm] = useState(initPlot);
  const [yearBuilt, setYearBuilt] = useState(String(initial?.year_built ?? ""));
  const [furnishing, setFurnishing] = useState(initial?.furnishing_status ?? "__none");
  const [parkingSpaces, setParkingSpaces] = useState(String(initial?.parking_spaces ?? ""));
  const [shortLetMinNights, setShortLetMinNights] = useState(String(initial?.short_let_min_nights ?? ""));
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [lat, setLat] = useState(String(initial?.latitude ?? ""));
  const [lng, setLng] = useState(String(initial?.longitude ?? ""));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [featuresText, setFeaturesText] = useState((initial?.features ?? []).join(", "));
  const [images, setImages] = useState<string[]>(initial?.images?.length ? initial.images : initial?.hero_image ? [initial.hero_image] : []);
  const [heroImage, setHeroImage] = useState(initial?.hero_image ?? "");
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [agentId, setAgentId] = useState(initial?.agent_id ?? "__none");
  const [availableFrom, setAvailableFrom] = useState(initial?.available_from ?? "");
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  const showShortLet = listingType === "short_let";

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const base64 = await fileToBase64(file);
        const { url } = await upload({
          data: { fileName: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", dataBase64: base64 },
        });
        urls.push(url);
      }
      setImages((prev) => [...prev, ...urls]);
      if (!heroImage && urls[0]) setHeroImage(urls[0]);
      toast.success(`Uploaded ${urls.length} image(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const mapsConfigured = !!getGoogleMapsApiKey();

  async function runGeocode() {
    if (!mapsConfigured) {
      toast.error(googleMapsConfigError());
      return;
    }
    const q = [address, city, country].filter(Boolean).join(", ");
    if (!q) {
      toast.error("Enter address, city, or country first");
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocode({ data: { address: q } });
      setLat(String(result.latitude));
      setLng(String(result.longitude));
      if (result.formatted && !address) setAddress(result.formatted);
      toast.success("Location found on map");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Geocode failed");
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const hero = heroImage || images[0] || null;
      await onSubmit({
        id: initial?.id,
        title,
        slug: slug || slugify(title),
        property_type: propertyType,
        listing_type: listingType,
        status,
        price: Number(price),
        currency,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        area_sqm: areaSqm ? (propertyType === "land" ? acresToSqm(Number(areaSqm)) : Number(areaSqm)) : null,
        plot_size_sqm: plotSizeSqm ? (propertyType === "land" ? acresToSqm(Number(plotSizeSqm)) : Number(plotSizeSqm)) : null,
        year_built: yearBuilt ? Number(yearBuilt) : null,
        furnishing_status: furnishing && furnishing !== "__none" ? furnishing : null,
        parking_spaces: parkingSpaces ? Number(parkingSpaces) : null,
        short_let_min_nights: shortLetMinNights ? Number(shortLetMinNights) : null,
        address: address || null,
        city: city || null,
        country: country || null,
        latitude: lat ? Number(lat) : null,
        longitude: lng ? Number(lng) : null,
        description: description || null,
        features: featuresText.split(",").map((f) => f.trim()).filter(Boolean),
        images,
        hero_image: hero,
        is_published: isPublished,
        is_featured: isFeatured,
        agent_id: agentId && agentId !== "__none" ? agentId : null,
        available_from: availableFrom || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-xl border p-4 ${
            isPublished
              ? "border-[#2563eb]/50 bg-neutral-900/10"
              : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span>
              <span className="font-medium text-foreground">Publish on public site</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {isPublished
                  ? "Visible on /properties, the homepage, and search."
                  : "Draft — saved in admin only until you check this."}
              </span>
            </span>
          </label>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            isFeatured
              ? "border-amber-400/60 bg-amber-400/10"
              : "border-border bg-muted/30"
          }`}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span>
              <span className="font-medium text-foreground">Feature this property</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {isFeatured
                  ? "Shows a star badge and appears first in listings."
                  : "Standard listing — not highlighted on the homepage."}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>URL slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title)} />
        </div>
        <div className="space-y-1.5">
          <Label>Property type</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.filter((t) => t.value !== "any").map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Listing</Label>
          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LISTING_TYPES.filter((t) => t.value !== "any").map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Price *</Label>
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        </div>
        <div className="space-y-1.5">
          <Label>Bedrooms</Label>
          <Input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Bathrooms</Label>
          <Input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{propertyType === "land" ? "Area (acres)" : "Area (m²)"}</Label>
          <Input type="number" min={0} step="any" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} placeholder={propertyType === "land" ? "e.g. 0.8" : ""} />
        </div>
        <div className="space-y-1.5">
          <Label>{propertyType === "land" ? "Plot size (acres)" : "Plot size (m²)"}</Label>
          <Input type="number" min={0} step="any" value={plotSizeSqm} onChange={(e) => setPlotSizeSqm(e.target.value)} placeholder={propertyType === "land" ? "e.g. 0.8" : ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Year built</Label>
          <Input type="number" min={1800} max={2030} value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="e.g. 2022" />
        </div>
        <div className="space-y-1.5">
          <Label>Furnishing</Label>
          <Select value={furnishing} onValueChange={setFurnishing}>
            <SelectTrigger><SelectValue placeholder="Not specified" /></SelectTrigger>
            <SelectContent>
              {FURNISHING_OPTIONS.map((o) => (
                <SelectItem key={o.value || "__none"} value={o.value || "__none"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Parking spaces</Label>
          <Input type="number" min={0} max={20} value={parkingSpaces} onChange={(e) => setParkingSpaces(e.target.value)} />
        </div>
        {showShortLet && (
          <div className="space-y-1.5">
            <Label>Min. nights (short let)</Label>
            <Input type="number" min={0} max={365} value={shortLetMinNights} onChange={(e) => setShortLetMinNights(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["available", "under_offer", "sold", "rented"].map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Assigned agent</Label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger><SelectValue placeholder="No agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No agent</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}{a.agency ? ` — ${a.agency}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Available from</Label>
          <Input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Location (for map)</Label>
          <Button type="button" variant="outline" size="sm" onClick={runGeocode} disabled={geocoding}>
            {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <span className="ml-2">Find on map</span>
          </Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} className="sm:col-span-2" />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
          <Input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
        {!mapsConfigured && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            Google Maps key missing: add <code className="rounded bg-muted px-1">VITE_GOOGLE_MAPS_API_KEY</code> to{" "}
            <code className="rounded bg-muted px-1">.env</code> and restart <code className="rounded bg-muted px-1">npm run dev</code>.
            You can still type latitude and longitude manually below.
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Properties need latitude & longitude to appear on the map.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Features (comma-separated)</Label>
        <Input value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Pool, Sea view, Garage" />
      </div>

      <div className="rounded-xl border border-border p-4">
        <Label className="text-base">Images</Label>
        <p className="mt-1 text-xs text-muted-foreground">Upload to Supabase storage (max 5MB each, JPEG/PNG/WebP/GIF). Drag images to reorder. First image is used as hero unless set below.</p>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 transition hover:bg-muted/50">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-sm">{uploading ? "Uploading…" : "Upload images"}</span>
        </label>
        {images.length > 0 && (
          <DraggableImageGrid
            images={images}
            heroImage={heroImage}
            onReorder={setImages}
            onRemove={(url) => {
              setImages((prev) => prev.filter((u) => u !== url));
              if (heroImage === url) setHeroImage("");
            }}
            onSetHero={setHeroImage}
          />
        )}
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs">Hero image URL (optional override)</Label>
          <Input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving || uploading} className="flex-1 rounded-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial?.id ? "Update property" : "Create property"}
        </Button>
      </div>
    </form>
  );
}

function DraggableImageGrid({
  images,
  heroImage,
  onReorder,
  onRemove,
  onSetHero,
}: {
  images: string[];
  heroImage: string;
  onReorder: (imgs: string[]) => void;
  onRemove: (url: string) => void;
  onSetHero: (url: string) => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = useCallback((idx: number) => {
    dragIdx.current = idx;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIdx: number) => {
      e.preventDefault();
      const fromIdx = dragIdx.current;
      if (fromIdx == null || fromIdx === toIdx) {
        setOverIdx(null);
        return;
      }
      const next = [...images];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onReorder(next);
      dragIdx.current = null;
      setOverIdx(null);
    },
    [images, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    dragIdx.current = null;
    setOverIdx(null);
  }, []);

  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((url, idx) => (
        <div
          key={url}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg bg-muted transition-all duration-200 active:cursor-grabbing ${
            overIdx === idx ? "scale-95 ring-2 ring-[#2563eb]" : ""
          } ${dragIdx.current === idx ? "opacity-40" : "opacity-100"}`}
        >
          <img src={url} alt="" className="h-full w-full object-cover pointer-events-none" />
          <div className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 transition group-hover:opacity-100">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white/60">
            {idx + 1}
          </span>
          <button
            type="button"
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
            onClick={() => onRemove(url)}
          >
            <X className="h-3 w-3" />
          </button>
          <button
            type="button"
            className={`absolute bottom-1 left-1 rounded px-1.5 text-[10px] ${heroImage === url ? "bg-neutral-900 text-black" : "bg-black/50 text-white"}`}
            onClick={() => onSetHero(url)}
          >
            Hero
          </button>
        </div>
      ))}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
