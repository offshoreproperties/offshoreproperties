import { useState, useRef, useCallback, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { createPropertyUploadUrl, finalizePropertyUpload } from "@/lib/storage.functions";
import { geocodeAddress, reverseGeocodeCoordinates } from "@/lib/geocode.functions";
import { checkGoogleMapsApi } from "@/lib/maps.functions";
import { adminListAgents } from "@/lib/admin-agents.functions";
import { slugify } from "@/lib/format";
import { PROPERTY_TYPES, LISTING_TYPES, DEFAULT_CURRENCY } from "@/lib/constants";
import { sortAmenities } from "@/lib/amenities";
import { getGoogleMapsApiKey, googleMapsConfigError } from "@/lib/google-maps";
import { parseGoogleMapsUrl } from "@/lib/maps-url";
import { ListingBadgePicker } from "@/components/listing-badge-picker";
import { AmenitiesPicker } from "@/components/amenities-picker";
import { LocationMapPicker } from "@/components/maps/location-map-picker";
import { normalizeListingBadges, type ListingBadgeId } from "@/lib/listing-badges";
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
import {
  isRecordingMime,
  isVideoUrl,
  isAudioUrl,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_RECORDING_UPLOAD_BYTES,
  PROPERTY_MEDIA_ACCEPT,
  prepareFileForUpload,
  resolvePropertyUploadMime,
} from "@/lib/media";
import { Loader2, MapPin, Upload, X, GripVertical, Link2, Video, Mic, Cloud, CloudOff, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { userFacingError } from "@/lib/user-facing-error";
import { cn } from "@/lib/utils";
import { usePropertyDraftAutosave } from "@/hooks/use-property-draft-autosave";
import type { PropertyFormDraftSnapshot } from "@/lib/property-draft";

const UPLOAD_CONCURRENCY = 1;

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
  listing_badges: string[];
  agent_id: string | null;
  available_from: string | null;
};

type Initial = Partial<PropertyFormValues> & {
  id?: string;
  areaSqm?: string;
  plotSizeSqm?: string;
  lat?: string;
  lng?: string;
  furnishing?: string;
  mapsLink?: string;
};

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
  draftId = null,
  onDraftIdChange,
  autosaveEnabled = false,
}: {
  initial?: Initial;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  onCancel?: () => void;
  draftId?: string | null;
  onDraftIdChange?: (id: string) => void;
  autosaveEnabled?: boolean;
}) {
  const createUploadUrl = useServerFn(createPropertyUploadUrl);
  const finalizeUpload = useServerFn(finalizePropertyUpload);
  const geocode = useServerFn(geocodeAddress);
  const reverseGeocode = useServerFn(reverseGeocodeCoordinates);
  const fetchAgents = useServerFn(adminListAgents);
  const checkMaps = useServerFn(checkGoogleMapsApi);

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => fetchAgents(),
  });

  const { data: mapsStatus } = useQuery({
    queryKey: ["maps-api-status"],
    queryFn: () => checkMaps(),
    staleTime: 5 * 60_000,
  });

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? "villa");
  const [listingType, setListingType] = useState(initial?.listing_type ?? "sale");
  const [status, setStatus] = useState(initial?.status ?? "available");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [currency, setCurrency] = useState(initial?.currency ?? DEFAULT_CURRENCY);
  const [bedrooms, setBedrooms] = useState(String(initial?.bedrooms ?? ""));
  const [bathrooms, setBathrooms] = useState(String(initial?.bathrooms ?? ""));
  const sqmToAcres = (sqm: number) => sqm / 4046.86;
  const acresToSqm = (acres: number) => acres * 4046.86;

  const initArea =
    initial?.areaSqm ??
    (initial?.area_sqm != null && initial.property_type === "land"
      ? String(parseFloat(sqmToAcres(Number(initial.area_sqm)).toFixed(4)))
      : String(initial?.area_sqm ?? ""));
  const initPlot =
    initial?.plotSizeSqm ??
    (initial?.plot_size_sqm != null && initial.property_type === "land"
      ? String(parseFloat(sqmToAcres(Number(initial.plot_size_sqm)).toFixed(4)))
      : String(initial?.plot_size_sqm ?? ""));

  const [areaSqm, setAreaSqm] = useState(initArea);
  const [plotSizeSqm, setPlotSizeSqm] = useState(initPlot);
  const [yearBuilt, setYearBuilt] = useState(String(initial?.year_built ?? ""));
  const [furnishing, setFurnishing] = useState(initial?.furnishing ?? initial?.furnishing_status ?? "__none");
  const [parkingSpaces, setParkingSpaces] = useState(String(initial?.parking_spaces ?? ""));
  const [shortLetMinNights, setShortLetMinNights] = useState(String(initial?.short_let_min_nights ?? ""));
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [lat, setLat] = useState(initial?.lat ?? String(initial?.latitude ?? ""));
  const [lng, setLng] = useState(initial?.lng ?? String(initial?.longitude ?? ""));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [images, setImages] = useState<string[]>(initial?.images?.length ? initial.images : initial?.hero_image ? [initial.hero_image] : []);
  const [heroImage, setHeroImage] = useState(initial?.hero_image ?? "");
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [listingBadges, setListingBadges] = useState<ListingBadgeId[]>(
    normalizeListingBadges(initial?.listing_badges),
  );
  const [agentId, setAgentId] = useState(initial?.agent_id ?? "__none");
  const [availableFrom, setAvailableFrom] = useState(initial?.available_from ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordVideoInputRef = useRef<HTMLInputElement>(null);
  const recordAudioInputRef = useRef<HTMLInputElement>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapsLink, setMapsLink] = useState(initial?.mapsLink ?? "");
  const [saving, setSaving] = useState(false);

  const getSnapshot = useCallback(
    (): PropertyFormDraftSnapshot => ({
      propertyId: initial?.id,
      title,
      slug,
      property_type: propertyType,
      listing_type: listingType,
      status,
      price,
      currency,
      bedrooms,
      bathrooms,
      areaSqm,
      plotSizeSqm,
      yearBuilt,
      furnishing,
      parkingSpaces,
      shortLetMinNights,
      address,
      city,
      country,
      lat,
      lng,
      description,
      features,
      images,
      heroImage,
      isPublished,
      isFeatured,
      listingBadges,
      agentId,
      availableFrom,
      mapsLink,
    }),
    [
      initial?.id,
      title,
      slug,
      propertyType,
      listingType,
      status,
      price,
      currency,
      bedrooms,
      bathrooms,
      areaSqm,
      plotSizeSqm,
      yearBuilt,
      furnishing,
      parkingSpaces,
      shortLetMinNights,
      address,
      city,
      country,
      lat,
      lng,
      description,
      features,
      images,
      heroImage,
      isPublished,
      isFeatured,
      listingBadges,
      agentId,
      availableFrom,
      mapsLink,
    ],
  );

  const { saveState, lastSavedAt, scheduleSave, flushSave } = usePropertyDraftAutosave({
    draftId,
    onDraftIdChange: onDraftIdChange ?? (() => {}),
    getSnapshot,
    enabled: autosaveEnabled && !!onDraftIdChange,
  });

  useEffect(() => {
    if (autosaveEnabled) scheduleSave();
  }, [autosaveEnabled, getSnapshot, scheduleSave]);

  const showShortLet = listingType === "short_let";

  const uploadOneFile = useCallback(
    async (file: File) => {
      const prepared = await prepareFileForUpload(file);
      const contentType = resolvePropertyUploadMime(prepared);
      if (!contentType) throw new Error("Unsupported file type");

      // Direct-to-Supabase upload (avoids huge base64 server-fn payloads)
      const slot = await createUploadUrl({
        data: {
          fileName: prepared.name,
          contentType,
          fileSize: prepared.size,
        },
      });

      const putRes = await fetch(slot.signedUrl, {
        method: "PUT",
        body: prepared,
        headers: {
          "Content-Type": contentType,
          ...(slot.token ? { "x-upsert": "false" } : {}),
        },
      });

      if (!putRes.ok) {
        const detail = await putRes.text().catch(() => "");
        throw new Error(
          detail.includes("Payload too large")
            ? "File too large for storage — try a smaller photo"
            : `Storage rejected upload (${putRes.status})`,
        );
      }

      try {
        const { url } = await finalizeUpload({
          data: {
            path: slot.path,
            fileName: prepared.name,
            contentType,
          },
        });
        return url;
      } catch {
        return slot.publicUrl;
      }
    },
    [createUploadUrl, finalizeUpload],
  );

  async function handleFiles(files: FileList | File[] | null) {
    if (!files?.length) return;

    const queue = Array.from(files);
    const valid: File[] = [];

    for (const file of queue) {
      const mime = resolvePropertyUploadMime(file);
      if (!mime) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      const maxBytes = isRecordingMime(mime)
        ? MAX_RECORDING_UPLOAD_BYTES
        : MAX_IMAGE_UPLOAD_BYTES;
      if (file.size > maxBytes) {
        toast.error(`${file.name} is too large (max ${maxBytes / (1024 * 1024)}MB)`);
        continue;
      }
      valid.push(file);
    }

    if (!valid.length) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: valid.length });

    let completed = 0;
    let failed = 0;
    let lastError = "";
    let firstUrl: string | undefined;
    const pending = [...valid];

    async function worker() {
      while (pending.length) {
        const file = pending.shift();
        if (!file) break;
        try {
          const url = await uploadOneFile(file);
          if (!firstUrl) firstUrl = url;
          setImages((prev) => [...prev, url]);
          completed += 1;
        } catch (e) {
          failed += 1;
          lastError = userFacingError(e, "upload failed");
          toast.error(`${file.name}: ${lastError}`);
        } finally {
          setUploadProgress({ done: completed + failed, total: valid.length });
        }
      }
    }

    try {
      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, valid.length) }, () => worker()),
      );
      if (completed > 0) {
        setHeroImage((current) => current || firstUrl || "");
        toast.success(`Uploaded ${completed} file${completed === 1 ? "" : "s"}`);
        if (autosaveEnabled) void flushSave();
      }
      if (failed > 0 && completed === 0) {
        toast.error(lastError || "Upload failed — check you're logged in as admin and try again.");
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (recordVideoInputRef.current) recordVideoInputRef.current.value = "";
      if (recordAudioInputRef.current) recordAudioInputRef.current.value = "";
    }
  }

  const mapsConfigured = !!getGoogleMapsApiKey();
  const mapsWorking = mapsStatus?.ok === true;

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

  function applyMapsLink() {
    const coords = parseGoogleMapsUrl(mapsLink);
    if (!coords) {
      toast.error("Paste a valid Google Maps link or coordinates (lat, lng)");
      return;
    }
    setLat(String(coords.lat));
    setLng(String(coords.lng));
    setMapsLink("");
    toast.success("Location imported from Google Maps link");
    void syncAddressFromCoords(coords.lat, coords.lng);
  }

  async function syncAddressFromCoords(latitude: number, longitude: number) {
    if (!mapsConfigured) return;
    try {
      const result = await reverseGeocode({ data: { latitude, longitude } });
      if (result.formatted && !address) setAddress(result.formatted);
      if (result.city && !city) setCity(result.city);
      if (result.country && !country) setCountry(result.country);
    } catch {
      // Optional enrichment — ignore failures
    }
  }

  function handleMapPick(coords: { latitude: number; longitude: number }) {
    setLat(String(coords.latitude));
    setLng(String(coords.longitude));
    void syncAddressFromCoords(coords.latitude, coords.longitude);
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
        features: sortAmenities(features),
        images,
        hero_image: hero,
        is_published: isPublished,
        is_featured: isFeatured,
        listing_badges: listingBadges,
        agent_id: agentId && agentId !== "__none" ? agentId : null,
        available_from: availableFrom || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24 sm:pb-0">
      {autosaveEnabled && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
            saveState === "error"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900",
          )}
        >
          {saveState === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saveState === "error" ? (
            <CloudOff className="h-3.5 w-3.5" />
          ) : (
            <Cloud className="h-3.5 w-3.5" />
          )}
          <span className="min-w-0 flex-1">
            {saveState === "saving" && "Saving draft…"}
            {saveState === "saved" &&
              (lastSavedAt
                ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Autosave on")}
            {saveState === "idle" && "Autosave on"}
            {saveState === "error" && "Save failed — check connection"}
            <span className="hidden sm:inline">
              {saveState === "saved" && lastSavedAt ? " — safe to refresh" : saveState === "idle" ? " — syncs to server" : ""}
            </span>
          </span>
        </div>
      )}

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

        <ListingBadgePicker
          value={listingBadges}
          onChange={setListingBadges}
          isFeatured={isFeatured}
          onFeaturedChange={setIsFeatured}
        />
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label className="text-base">Location (for map &amp; directions)</Label>
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
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Paste Google Maps link or lat, lng"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={applyMapsLink} disabled={!mapsLink.trim()}>
            <Link2 className="mr-2 h-4 w-4" />
            Import link
          </Button>
        </div>
        <div className="mt-4">
          <LocationMapPicker
            latitude={lat ? Number(lat) : null}
            longitude={lng ? Number(lng) : null}
            onChange={handleMapPick}
          />
        </div>
        {!mapsConfigured && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            Google Maps key missing: add <code className="rounded bg-muted px-1">VITE_GOOGLE_MAPS_API_KEY</code> and{" "}
            <code className="rounded bg-muted px-1">GOOGLE_MAPS_API_KEY</code> to{" "}
            <code className="rounded bg-muted px-1">.env</code> / Render, then redeploy.
            You can still type latitude and longitude manually.
          </p>
        )}
        {mapsConfigured && mapsStatus && !mapsWorking && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            {mapsStatus.message}
            {mapsStatus.apis?.length ? (
              <span className="mt-1 block text-amber-800/80 dark:text-amber-300/80">
                Enable: {mapsStatus.apis.join(", ")}
              </span>
            ) : null}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Set the pin on the map so visitors can explore the area in 3D and open directions in Google Maps.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <AmenitiesPicker value={features} onChange={setFeatures} />

      <div className="rounded-xl border border-border p-4">
        <Label className="text-base">Photos, videos &amp; recordings</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Select or drag many files at once — photos, phone videos, and voice notes. Uploads run in
          parallel; images and videos get the Offshore watermark. Photos: JPG, JPEG, PNG, WebP, GIF, HEIC
          (up to 10MB; large photos are compressed automatically). Recordings up to 80MB.
        </p>
        <label
          className={cn(
            "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 transition",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50",
            uploading && "pointer-events-none opacity-70",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (!uploading) void handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={PROPERTY_MEDIA_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-sm font-medium">
            {uploading && uploadProgress
              ? `Uploading ${uploadProgress.done} of ${uploadProgress.total}…`
              : "Choose photos, videos, or recordings"}
          </span>
          <span className="text-xs text-muted-foreground">
            {uploading ? "You can keep editing other fields while uploads finish" : "or drag and drop here"}
          </span>
        </label>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={uploading}
            onClick={() => recordVideoInputRef.current?.click()}
          >
            <Video className="mr-2 h-4 w-4" />
            Record video
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={uploading}
            onClick={() => recordAudioInputRef.current?.click()}
          >
            <Mic className="mr-2 h-4 w-4" />
            Record audio
          </Button>
          <input
            ref={recordVideoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
            disabled={uploading}
          />
          <input
            ref={recordAudioInputRef}
            type="file"
            accept="audio/*"
            capture
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
            disabled={uploading}
          />
        </div>
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

      <div className="hidden gap-3 sm:flex">
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

      <div className="mobile-action-bar sm:hidden">
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" className="h-11 flex-1 rounded-full" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={saving || uploading} className="h-11 flex-1 rounded-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial?.id ? "Update" : "Create"}
          </Button>
        </div>
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

  const moveItem = useCallback(
    (idx: number, direction: -1 | 1) => {
      const toIdx = idx + direction;
      if (toIdx < 0 || toIdx >= images.length) return;
      const next = [...images];
      const [moved] = next.splice(idx, 1);
      next.splice(toIdx, 0, moved);
      onReorder(next);
    },
    [images, onReorder],
  );

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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
          {isVideoUrl(url) ? (
            <video src={url} className="h-full w-full object-cover pointer-events-none" muted playsInline preload="metadata" />
          ) : isAudioUrl(url) ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-900 p-2 text-white">
              <Mic className="h-6 w-6 opacity-80" />
              <audio src={url} controls className="h-8 w-full max-w-full" preload="metadata" />
            </div>
          ) : (
            <img src={url} alt="" className="h-full w-full object-cover pointer-events-none" />
          )}
          <div className="absolute left-1 top-1 flex flex-col gap-0.5">
            <button
              type="button"
              disabled={idx === 0}
              className="touch-show flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-100 disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => moveItem(idx, -1)}
              aria-label="Move earlier"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={idx === images.length - 1}
              className="touch-show flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-100 disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => moveItem(idx, 1)}
              aria-label="Move later"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 transition group-hover:opacity-100 sm:flex">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white/60">
            {idx + 1}
          </span>
          <button
            type="button"
            className="touch-show absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={() => onRemove(url)}
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={`touch-show absolute bottom-1 left-1 min-h-[28px] rounded px-2 text-[10px] opacity-100 sm:opacity-100 ${heroImage === url ? "bg-neutral-900 text-white" : "bg-black/50 text-white sm:opacity-0 sm:group-hover:opacity-100"}`}
            onClick={() => onSetHero(url)}
          >
            Hero
          </button>
        </div>
      ))}
    </div>
  );
}
