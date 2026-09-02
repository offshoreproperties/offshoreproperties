import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabaseAnonServer } from "@/integrations/supabase/client.anon-server";
import { requireUserAuth } from "@/integrations/supabase/user-middleware";

export const getPropertyEngagement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ propertyId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const [likes, saves] = await Promise.all([
      supabaseAnonServer.from("property_likes").select("*", { count: "exact", head: true }).eq("property_id", data.propertyId),
      supabaseAnonServer.from("property_saves").select("*", { count: "exact", head: true }).eq("property_id", data.propertyId),
    ]);
    return {
      likeCount: likes.count ?? 0,
      saveCount: saves.count ?? 0,
    };
  });

export const getMyEngagement = createServerFn({ method: "POST" })
  .middleware([requireUserAuth])
  .inputValidator((input: unknown) => z.object({ propertyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId as string;
    const [like, save] = await Promise.all([
      supabaseAdmin.from("property_likes").select("property_id").eq("user_id", userId).eq("property_id", data.propertyId).maybeSingle(),
      supabaseAdmin.from("property_saves").select("property_id").eq("user_id", userId).eq("property_id", data.propertyId).maybeSingle(),
    ]);
    return { liked: !!like.data, saved: !!save.data };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireUserAuth])
  .inputValidator((input: unknown) => z.object({ propertyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId as string;
    const existing = await supabaseAdmin
      .from("property_likes")
      .select("property_id")
      .eq("user_id", userId)
      .eq("property_id", data.propertyId)
      .maybeSingle();

    if (existing.data) {
      await supabaseAdmin.from("property_likes").delete().eq("user_id", userId).eq("property_id", data.propertyId);
      return { liked: false };
    }
    const { error } = await supabaseAdmin.from("property_likes").insert({ user_id: userId, property_id: data.propertyId });
    if (error) throw new Error(error.message);
    return { liked: true };
  });

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([requireUserAuth])
  .inputValidator((input: unknown) => z.object({ propertyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId as string;
    const existing = await supabaseAdmin
      .from("property_saves")
      .select("property_id")
      .eq("user_id", userId)
      .eq("property_id", data.propertyId)
      .maybeSingle();

    if (existing.data) {
      await supabaseAdmin.from("property_saves").delete().eq("user_id", userId).eq("property_id", data.propertyId);
      return { saved: false };
    }
    const { error } = await supabaseAdmin.from("property_saves").insert({ user_id: userId, property_id: data.propertyId });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const listSavedProperties = createServerFn({ method: "GET" })
  .middleware([requireUserAuth])
  .handler(async ({ context }) => {
    const userId = context.userId as string;
    const { data: saves, error } = await supabaseAdmin
      .from("property_saves")
      .select("property_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!saves?.length) return [];

    const ids = saves.map((s) => s.property_id);
    const { data: properties, error: pErr } = await supabaseAnonServer
      .from("properties")
      .select(
        "id, title, slug, property_type, listing_type, status, price, currency, bedrooms, bathrooms, area_sqm, plot_size_sqm, address, city, country, description, features, hero_image, images, is_featured, latitude, longitude, created_at",
      )
      .in("id", ids)
      .eq("is_published", true);

    if (pErr) throw pErr;
    return properties ?? [];
  });
