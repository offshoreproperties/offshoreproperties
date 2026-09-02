-- Admin property form drafts (server-side, syncs across devices)

CREATE TABLE public.property_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  label text NOT NULL DEFAULT 'Untitled draft',
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_drafts_updated ON public.property_drafts(updated_at DESC);
CREATE UNIQUE INDEX idx_property_drafts_property_id ON public.property_drafts(property_id)
  WHERE property_id IS NOT NULL;

CREATE TRIGGER trg_property_drafts_updated_at
  BEFORE UPDATE ON public.property_drafts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.property_drafts ENABLE ROW LEVEL SECURITY;

-- Admin server functions use service role; no public access.
