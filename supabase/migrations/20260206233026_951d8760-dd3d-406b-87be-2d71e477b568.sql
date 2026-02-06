
-- Allow anonymous users to view approved listings
DROP POLICY "Anyone can view approved listings" ON public.training_listings;
CREATE POLICY "Anyone can view approved listings" ON public.training_listings
  FOR SELECT USING (status = 'approved'::listing_status);

-- Allow anonymous users to view approved partner profiles
DROP POLICY "Anyone authenticated can view approved partners" ON public.partner_profiles;
CREATE POLICY "Anyone can view approved partners" ON public.partner_profiles
  FOR SELECT USING (approved = true);
