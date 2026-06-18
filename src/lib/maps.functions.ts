import { createServerFn } from "@tanstack/react-start";
import { getGoogleMapsApiKey, googleMapsConfigError } from "@/lib/google-maps";

/** Quick health check — Geocoding API must be enabled for admin geocode + this probe. */
export const checkGoogleMapsApi = createServerFn({ method: "GET" }).handler(async () => {
  const key = getGoogleMapsApiKey();
  if (!key) {
    return {
      ok: false as const,
      message: googleMapsConfigError(),
      apis: [] as string[],
    };
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent("Nairobi, Kenya")}&key=${key}`,
  );
  const json = (await res.json()) as {
    status: string;
    error_message?: string;
  };

  if (json.status === "OK") {
    return {
      ok: true as const,
      message: "Google Maps API key is working.",
      apis: ["Geocoding API"],
    };
  }

  const err = json.error_message ?? json.status;
  const needsEnable =
    err.includes("not activated") ||
    err.includes("REQUEST_DENIED") ||
    json.status === "REQUEST_DENIED";

  return {
    ok: false as const,
    message: needsEnable
      ? "Your API key is valid, but Maps APIs are not turned on for this Google Cloud project. Enable the three APIs below, turn on billing (Google requires it even for free usage), then wait 1–2 minutes and refresh."
      : err,
    detail: needsEnable ? err : undefined,
    apis: ["Maps JavaScript API", "Geocoding API", "Maps Embed API"],
  };
});
