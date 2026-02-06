-- Fix bookings RLS: policies are RESTRICTIVE which means ALL must pass.
-- Drop restrictive policies and recreate as PERMISSIVE so ANY matching policy grants access.

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Partners can view bookings for their listings" ON public.bookings;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage bookings"
ON public.bookings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view bookings for their listings"
ON public.bookings FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM training_listings tl
  JOIN partner_profiles pp ON pp.id = tl.partner_id
  WHERE tl.id = bookings.listing_id AND pp.user_id = auth.uid()
));