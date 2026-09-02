/** Never show raw HTML/server crash pages to visitors or admins in the UI. */
export function sanitizeUserFacingError(message: string | undefined | null): string | null {
  if (!message?.trim()) return null;
  const trimmed = message.trim();
  if (
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.includes("<html") ||
    trimmed.includes("This page didn't load") ||
    trimmed.includes("Something went wrong on our end")
  ) {
    return "Something went wrong — please refresh and try again.";
  }
  if (trimmed.length > 280) {
    return `${trimmed.slice(0, 280)}…`;
  }
  return trimmed;
}

export function userFacingError(error: unknown, fallback = "Something went wrong — please try again."): string {
  if (error instanceof Error) {
    return sanitizeUserFacingError(error.message) ?? fallback;
  }
  if (typeof error === "string") {
    return sanitizeUserFacingError(error) ?? fallback;
  }
  return fallback;
}
