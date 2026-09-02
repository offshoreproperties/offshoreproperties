import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { getGoogleMapsApiKey, googleMapsConfigError } from "@/lib/google-maps";

export const geocodeAddress = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => z.object({ address: z.string().min(3).max(500) }).parse(input))
  .handler(async ({ data }) => {
    const key = getGoogleMapsApiKey();
    if (!key) throw new Error(googleMapsConfigError());

    const q = encodeURIComponent(data.address);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${key}`,
    );
    const json = await res.json();
    if (json.status !== "OK" || !json.results?.[0]) {
      throw new Error("Could not find coordinates for this address");
    }
    const { lat, lng } = json.results[0].geometry.location;
    return { latitude: lat as number, longitude: lng as number, formatted: json.results[0].formatted_address as string };
  });

export const reverseGeocodeCoordinates = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = getGoogleMapsApiKey();
    if (!key) throw new Error(googleMapsConfigError());

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}&key=${key}`,
    );
    const json = await res.json();
    if (json.status !== "OK" || !json.results?.[0]) {
      return {
        formatted: null as string | null,
        address: null as string | null,
        city: null as string | null,
        country: null as string | null,
      };
    }

    const result = json.results[0] as {
      formatted_address: string;
      address_components: Array<{ long_name: string; types: string[] }>;
    };

    const find = (type: string) =>
      result.address_components.find((c) => c.types.includes(type))?.long_name ?? null;

    return {
      formatted: result.formatted_address,
      address: find("route") ?? find("premise") ?? find("establishment"),
      city: find("locality") ?? find("administrative_area_level_2") ?? find("administrative_area_level_1"),
      country: find("country"),
    };
  });
