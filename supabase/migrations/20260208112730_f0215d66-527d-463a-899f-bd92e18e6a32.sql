
-- Add location type and gym info columns to training_listings
ALTER TABLE public.training_listings
  ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'gym',
  ADD COLUMN IF NOT EXISTS gym_name text,
  ADD COLUMN IF NOT EXISTS gym_instagram text,
  ADD COLUMN IF NOT EXISTS gym_facebook text;

-- Add location type and gym info columns to training_packages
ALTER TABLE public.training_packages
  ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'gym',
  ADD COLUMN IF NOT EXISTS gym_name text,
  ADD COLUMN IF NOT EXISTS gym_instagram text,
  ADD COLUMN IF NOT EXISTS gym_facebook text;
