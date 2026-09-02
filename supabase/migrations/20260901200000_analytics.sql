-- Site-wide visit tracking + keep properties.view_count in sync with property_views

CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX idx_site_visits_path ON public.site_visits (path);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone records a site visit"
  ON public.site_visits FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read site visits"
  ON public.site_visits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.bump_property_view_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_property_view_count ON public.property_views;
CREATE TRIGGER trg_bump_property_view_count
  AFTER INSERT ON public.property_views
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_property_view_count();

-- Align stored counters with historical view rows
UPDATE public.properties p
SET view_count = COALESCE((
  SELECT COUNT(*)::integer FROM public.property_views pv WHERE pv.property_id = p.id
), 0);
