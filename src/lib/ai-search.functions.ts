import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAnonServer } from "@/integrations/supabase/client.anon-server";
import { rateLimit } from "@/lib/rate-limit";
import { aiConfigError, runAiChat } from "@/lib/ai-client";

const Schema = z.object({
  query: z.string().min(1).max(500),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseMatchIds(content: string): string[] {
  const match = content.match(/MATCHES:\s*(\[[^\]]*\])/i);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function stripMatchLine(content: string): string {
  return content.replace(/\n?MATCHES:\s*\[[^\]]*\]\s*/i, "").trim();
}

/**
 * AI-powered natural language property search.
 * Uses Anthropic, OpenAI, Gemini, or Lovable gateway (whichever key is in .env).
 */
export const aiSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    rateLimit("ai-search", 12, 60_000);

    const { data: rows, error } = await supabaseAnonServer
      .from("properties")
      .select(
        "id, slug, title, property_type, listing_type, price, currency, bedrooms, bathrooms, area_sqm, city, country, features, description, hero_image",
      )
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .limit(100);
    if (error) throw error;

    const catalog = (rows ?? []).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      type: r.property_type,
      listing: r.listing_type,
      price: `${r.price} ${r.currency}`,
      beds: r.bedrooms,
      baths: r.bathrooms,
      area: r.area_sqm,
      city: r.city,
      country: r.country,
      features: (r.features ?? []).slice(0, 12),
      summary: (r.description ?? "").slice(0, 280),
    }));

    if (catalog.length === 0) {
      return {
        reply: "We don't have published listings yet. Check back soon or contact us for off-market options.",
        matches: [] as Array<{
          id: string;
          slug: string | null;
          title: string;
          hero_image: string | null;
          city: string | null;
          price: number;
          currency: string;
          listing_type: string;
        }>,
        matchSlugs: [] as string[],
      };
    }

    const sys = `You are the Offshore Properties concierge for Kenya real estate. The user describes what they want in natural language (any language).

Rules:
- Reply in the user's language, warmly and concisely (2-4 short paragraphs max).
- Recommend 1-5 best matches from the JSON catalog and explain why each fits.
- Only recommend properties that exist in the catalog.
- On the LAST line only, output exactly: MATCHES:["slug-or-id",...]
- Use each property's "slug" when present, otherwise its "id" (UUID).
- Order MATCHES by best fit first.

CATALOG:
${JSON.stringify(catalog)}`;

    let content: string;
    try {
      content = await runAiChat([
        { role: "system", content: sys },
        { role: "user", content: data.query },
      ]);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not configured")) {
        throw new Error(aiConfigError());
      }
      throw err;
    }

    const ids = parseMatchIds(content);
    const reply = stripMatchLine(content) || "Here are some properties that may suit you.";

    const slugRefs = ids.filter((id) => !UUID_RE.test(id));
    const uuidRefs = ids.filter((id) => UUID_RE.test(id));

    let matches: Array<{
      id: string;
      slug: string | null;
      title: string;
      hero_image: string | null;
      city: string | null;
      price: number;
      currency: string;
      listing_type: string;
    }> = [];

    if (slugRefs.length > 0) {
      const { data: bySlug } = await supabaseAnonServer
        .from("properties")
        .select("id, slug, title, hero_image, city, price, currency, listing_type")
        .in("slug", slugRefs)
        .eq("is_published", true);
      if (bySlug?.length) matches.push(...bySlug);
    }

    if (uuidRefs.length > 0) {
      const { data: byId } = await supabaseAnonServer
        .from("properties")
        .select("id, slug, title, hero_image, city, price, currency, listing_type")
        .in("id", uuidRefs)
        .eq("is_published", true);
      if (byId?.length) {
        for (const row of byId) {
          if (!matches.some((m) => m.id === row.id)) matches.push(row);
        }
      }
    }

    // Preserve AI ranking order
    const order = new Map(ids.map((id, i) => [id, i]));
    matches.sort((a, b) => {
      const aKey = order.get(a.slug ?? "") ?? order.get(a.id) ?? 999;
      const bKey = order.get(b.slug ?? "") ?? order.get(b.id) ?? 999;
      return aKey - bKey;
    });

    const matchSlugs = matches.map((m) => m.slug ?? m.id);

    return { reply, matches, matchSlugs };
  });
