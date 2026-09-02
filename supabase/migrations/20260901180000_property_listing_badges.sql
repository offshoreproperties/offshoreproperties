-- Marketing badges for property listings (hot deal, best deal, just sold, etc.)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_badges text[] NOT NULL DEFAULT '{}';
