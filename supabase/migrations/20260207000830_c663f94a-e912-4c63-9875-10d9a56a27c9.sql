
-- Create training_packages table for bundled sessions
CREATE TABLE public.training_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ka TEXT,
  description_en TEXT,
  description_ka TEXT,
  sport TEXT NOT NULL,
  training_type public.training_type NOT NULL DEFAULT 'one_on_one',
  sessions_count INTEGER NOT NULL DEFAULT 8,
  price_per_session_gel NUMERIC NOT NULL,
  total_price_gel NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_spots INTEGER NOT NULL DEFAULT 1,
  background_image_url TEXT,
  status public.listing_status NOT NULL DEFAULT 'draft',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view approved packages"
  ON public.training_packages FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Partners can view own packages"
  ON public.training_packages FOR SELECT
  USING (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = training_packages.partner_id AND pp.user_id = auth.uid()));

CREATE POLICY "Partners can create packages"
  ON public.training_packages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = training_packages.partner_id AND pp.user_id = auth.uid()));

CREATE POLICY "Partners can update own packages"
  ON public.training_packages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = training_packages.partner_id AND pp.user_id = auth.uid()));

CREATE POLICY "Partners can delete own packages"
  ON public.training_packages FOR DELETE
  USING (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = training_packages.partner_id AND pp.user_id = auth.uid()));

CREATE POLICY "Admins can view all packages"
  ON public.training_packages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update packages"
  ON public.training_packages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete packages"
  ON public.training_packages FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Add location column to training_listings if not exists
ALTER TABLE public.training_listings ADD COLUMN IF NOT EXISTS location TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_training_packages_updated_at
  BEFORE UPDATE ON public.training_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
