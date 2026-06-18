-- Ensure is_featured exists on live databases that predate the column
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_featured
  ON public.properties (is_featured, created_at DESC)
  WHERE is_featured = true;
