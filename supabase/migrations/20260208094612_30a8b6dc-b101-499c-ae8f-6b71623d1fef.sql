
ALTER TABLE public.partner_verifications
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS country_city text,
ADD COLUMN IF NOT EXISTS professional_description text,
ADD COLUMN IF NOT EXISTS trainer_type text,
ADD COLUMN IF NOT EXISTS years_experience text,
ADD COLUMN IF NOT EXISTS specializations text[],
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS representative_role text,
ADD COLUMN IF NOT EXISTS website_social text,
ADD COLUMN IF NOT EXISTS verification_step integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS rep_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS biz_status text DEFAULT 'pending';
