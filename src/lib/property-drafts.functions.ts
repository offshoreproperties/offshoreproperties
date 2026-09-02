import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import {
  draftLabelFromPayload,
  PropertyDraftPayloadSchema,
  type PropertyDraftPayload,
  type PropertyDraftRow,
} from "@/lib/property-draft";

function rowFromDb(row: {
  id: string;
  property_id: string | null;
  label: string;
  payload: unknown;
  created_at: string;
  updated_at: string;
}): PropertyDraftRow {
  return {
    id: row.id,
    property_id: row.property_id,
    label: row.label,
    payload: PropertyDraftPayloadSchema.parse(row.payload ?? {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const listPropertyDrafts = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("property_drafts")
      .select("id, property_id, label, payload, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowFromDb);
  });

export const getPropertyDraft = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("property_drafts")
      .select("id, property_id, label, payload, created_at, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return rowFromDb(row);
  });

const SaveDraftSchema = z.object({
  id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional().nullable(),
  payload: PropertyDraftPayloadSchema,
});

export const savePropertyDraft = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => SaveDraftSchema.parse(input))
  .handler(async ({ data }) => {
    const label = draftLabelFromPayload(data.payload);
    const propertyId = data.property_id ?? data.payload.propertyId ?? null;

    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("property_drafts")
        .update({
          label,
          payload: data.payload,
          property_id: propertyId,
        })
        .eq("id", data.id)
        .select("id, property_id, label, payload, created_at, updated_at")
        .single();
      if (error) throw new Error(error.message);
      return rowFromDb(row);
    }

    if (propertyId) {
      const { data: existing } = await supabaseAdmin
        .from("property_drafts")
        .select("id")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (existing?.id) {
        const { data: row, error } = await supabaseAdmin
          .from("property_drafts")
          .update({
            label,
            payload: data.payload,
          })
          .eq("id", existing.id)
          .select("id, property_id, label, payload, created_at, updated_at")
          .single();
        if (error) throw new Error(error.message);
        return rowFromDb(row);
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("property_drafts")
      .insert({
        label,
        payload: data.payload,
        property_id: propertyId,
      })
      .select("id, property_id, label, payload, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return rowFromDb(row);
  });

export const createEmptyPropertyDraft = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { data: row, error } = await supabaseAdmin
      .from("property_drafts")
      .insert({
        label: "Untitled draft",
        payload: {},
      })
      .select("id, property_id, label, payload, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return rowFromDb(row);
  });

export const deletePropertyDraft = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("property_drafts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type { PropertyDraftPayload };
