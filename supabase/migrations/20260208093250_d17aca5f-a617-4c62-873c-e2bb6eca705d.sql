
-- Add difficulty_level to training_listings
ALTER TABLE public.training_listings 
ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT NULL;

-- Add rental_info columns to training_listings
ALTER TABLE public.training_listings 
ADD COLUMN IF NOT EXISTS rental_info_en text DEFAULT NULL;

ALTER TABLE public.training_listings 
ADD COLUMN IF NOT EXISTS rental_info_ka text DEFAULT NULL;

-- Add difficulty_level to training_packages
ALTER TABLE public.training_packages 
ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT NULL;

-- Add rental_info columns to training_packages
ALTER TABLE public.training_packages 
ADD COLUMN IF NOT EXISTS rental_info_en text DEFAULT NULL;

ALTER TABLE public.training_packages 
ADD COLUMN IF NOT EXISTS rental_info_ka text DEFAULT NULL;
