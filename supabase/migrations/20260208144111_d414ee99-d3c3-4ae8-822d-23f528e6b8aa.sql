
-- Fix 1: Reviews policies - drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for own bookings" ON public.reviews;

CREATE POLICY "Admins can manage reviews"
ON public.reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for own bookings"
ON public.reviews
FOR INSERT
WITH CHECK (
  (auth.uid() = reviewer_id) AND (
    (
      reviewer_role = 'user' AND EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = reviews.booking_id AND b.user_id = auth.uid() AND b.booking_status = 'completed'
      )
    ) OR (
      reviewer_role = 'partner' AND EXISTS (
        SELECT 1 FROM bookings b
        JOIN training_listings tl ON tl.id = b.listing_id
        JOIN partner_profiles pp ON pp.id = tl.partner_id
        WHERE b.id = reviews.booking_id AND pp.user_id = auth.uid() AND b.booking_status = 'completed'
      )
    )
  )
);

-- Fix 2: Create a security definer function to add both participants to a thread
CREATE OR REPLACE FUNCTION public.create_thread_with_participants(
  p_listing_id uuid,
  p_user_id uuid,
  p_other_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  -- Ensure caller is the user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Create thread
  INSERT INTO conversation_threads (listing_id)
  VALUES (p_listing_id)
  RETURNING id INTO v_thread_id;

  -- Add both participants
  INSERT INTO conversation_participants (thread_id, user_id)
  VALUES (v_thread_id, p_user_id), (v_thread_id, p_other_user_id);

  RETURN v_thread_id;
END;
$$;
