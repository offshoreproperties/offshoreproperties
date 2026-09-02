-- Anonymous visitor likes & saves (synced via server; no auth required)

CREATE TABLE public.guest_property_likes (
  visitor_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, property_id)
);

CREATE TABLE public.guest_property_saves (
  visitor_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, property_id)
);

ALTER TABLE public.guest_property_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_property_saves ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_guest_likes_property ON public.guest_property_likes(property_id);
CREATE INDEX idx_guest_saves_visitor ON public.guest_property_saves(visitor_id);
CREATE INDEX idx_guest_likes_visitor ON public.guest_property_likes(visitor_id);
