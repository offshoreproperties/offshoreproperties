import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAnonServer } from "@/integrations/supabase/client.anon-server";
import { rateLimit } from "@/lib/rate-limit";
import { aiConfigError, runAiChat } from "@/lib/ai-client";
import { normalizeAiReply } from "@/lib/ai-format";
import { buildSearchAdvisorPrompt } from "@/lib/ai-prompts";
import { areaContextForProperty, findKenyaArea } from "@/lib/kenya-locations";

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

function detectLocationHint(query: string): string | undefined {
  const area = findKenyaArea(query);
  return area?.label ?? area?.city;
}

/**
 * AI-powered natural language property search with location-aware sales advisor tone.
 */
export const aiSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    rateLimit("ai-search", 12, 60_000);

    const { data: rows, error } = await supabaseAnonServer
      .from("properties")
      .select(
        "id, slug, title, property_type, listing_type, price, currency, bedrooms, bathrooms, area_sqm, address, city, country, features, description, hero_image",
      )
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .limit(100);
    if (error) throw error;

    const catalog = (rows ?? []).map((r) => {
      const area = areaContextForProperty(r);
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        type: r.property_type,
        listing: r.listing_type,
        price: `${r.price} ${r.currency}`,
        beds: r.bedrooms,
        baths: r.bathrooms,
        area: r.area_sqm,
        address: r.address,
        city: r.city,
        country: r.country,
        areaHint: area ? `${area.label}, ${area.city}` : r.city,
        amenities: (r.features ?? []).slice(0, 16),
        summary: (r.description ?? "").slice(0, 320),
      };
    });

    if (catalog.length === 0) {
      return {
        reply:
          "We do not have published listings on the site yet. Please check back soon, or contact our team for off-market options in your preferred area.",
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
        locationHint: undefined as string | undefined,
      };
    }

    const sys = buildSearchAdvisorPrompt(JSON.stringify(catalog));

    let content: string;
    try {
      content = await runAiChat([
        { role: "system", content: sys },
        { role: "user", content: data.query },
      ]);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not configured")) {
        throw new Error(
          "Our search assistant is taking a short break — browse listings below or message us on WhatsApp.",
        );
      }
      throw err;
    }

    const ids = parseMatchIds(content);
    const reply =
      normalizeAiReply(stripMatchLine(content)) ||
      "Here are some properties from our collection that may suit what you are looking for.";

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

    const order = new Map(ids.map((id, i) => [id, i]));
    matches.sort((a, b) => {
      const aKey = order.get(a.slug ?? "") ?? order.get(a.id) ?? 999;
      const bKey = order.get(b.slug ?? "") ?? order.get(b.id) ?? 999;
      return aKey - bKey;
    });

    const matchSlugs = matches.map((m) => m.slug ?? m.id);
    const locationHint = detectLocationHint(data.query);

    return { reply, matches, matchSlugs, locationHint };
  });
