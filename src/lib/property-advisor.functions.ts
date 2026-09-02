import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAnonServer } from "@/integrations/supabase/client.anon-server";
import { rateLimit } from "@/lib/rate-limit";
import { runAiChat } from "@/lib/ai-client";
import { normalizeAiReply } from "@/lib/ai-format";
import { buildPropertyAdvisorPrompt } from "@/lib/ai-prompts";
import { areaContextForProperty, formatAreaBrief } from "@/lib/kenya-locations";

const Schema = z.object({
  propertyId: z.string().uuid(),
  question: z.string().max(500).optional(),
});

/** In-depth property briefing — location, lifestyle, amenities as a sales advisor would explain. */
export const propertyAdvisor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    rateLimit("property-advisor", 20, 60_000);

    const { data: property, error } = await supabaseAnonServer
      .from("properties")
      .select(
        "id, slug, title, property_type, listing_type, status, price, currency, bedrooms, bathrooms, area_sqm, plot_size_sqm, address, city, country, features, description, furnishing_status, parking_spaces, is_featured, listing_badges",
      )
      .eq("id", data.propertyId)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw error;
    if (!property) throw new Error("Property not found.");

    const area = areaContextForProperty(property);
    const areaBrief = area ? formatAreaBrief(area) : null;

    const listing = {
      title: property.title,
      type: property.property_type,
      listing: property.listing_type,
      status: property.status,
      price: `${property.price} ${property.currency}`,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqm: property.area_sqm,
      plotSqm: property.plot_size_sqm,
      address: property.address,
      city: property.city,
      country: property.country,
      furnishing: property.furnishing_status,
      parking: property.parking_spaces,
      amenities: property.features ?? [],
      description: property.description,
      featured: property.is_featured,
      badges: property.listing_badges ?? [],
    };

    const userMessage =
      data.question?.trim() ||
      "Please give me a thorough overview of this property and the neighbourhood — lifestyle, nearby amenities, and who it would suit.";

    let content: string;
    try {
      content = await runAiChat([
        { role: "system", content: buildPropertyAdvisorPrompt(JSON.stringify(listing), areaBrief) },
        { role: "user", content: userMessage },
      ]);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not configured")) {
        throw new Error(
          "We couldn't load that just now — message us on WhatsApp and we'll help directly.",
        );
      }
      throw err;
    }

    return {
      reply: normalizeAiReply(content),
      areaLabel: area?.label ?? property.city,
    };
  });
