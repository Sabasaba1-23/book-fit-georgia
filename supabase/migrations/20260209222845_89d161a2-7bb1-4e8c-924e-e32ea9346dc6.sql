
-- Create partner_media table for Photos & Media feature
CREATE TABLE public.partner_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_media ENABLE ROW LEVEL SECURITY;

-- Partners can view their own media
CREATE POLICY "Partners can view own media"
  ON public.partner_media FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Public can view media of approved partners
CREATE POLICY "Public can view approved partner media"
  ON public.partner_media FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE approved = true
    )
  );

-- Partners can insert their own media
CREATE POLICY "Partners can insert own media"
  ON public.partner_media FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Partners can update their own media
CREATE POLICY "Partners can update own media"
  ON public.partner_media FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Partners can delete their own media
CREATE POLICY "Partners can delete own media"
  ON public.partner_media FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX idx_partner_media_partner_id ON public.partner_media(partner_id);
CREATE INDEX idx_partner_media_featured ON public.partner_media(partner_id, is_featured) WHERE is_featured = true;
