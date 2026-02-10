
-- Add optional venue fee column to training_listings
ALTER TABLE public.training_listings
ADD COLUMN venue_fee_gel numeric DEFAULT NULL;

-- Add optional venue fee column to training_packages
ALTER TABLE public.training_packages
ADD COLUMN venue_fee_gel numeric DEFAULT NULL;
