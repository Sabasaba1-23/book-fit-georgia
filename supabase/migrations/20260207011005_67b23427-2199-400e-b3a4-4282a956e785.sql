
-- Add stats columns to partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS avg_rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS dispute_rate numeric DEFAULT 0;

-- Create completion confirmation status enum
CREATE TYPE public.confirmation_status AS ENUM ('pending', 'confirmed', 'disputed');

-- Create completion_requests table
CREATE TABLE public.completion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_status confirmation_status NOT NULL DEFAULT 'pending',
  partner_status confirmation_status NOT NULL DEFAULT 'pending',
  user_confirmed_at timestamptz,
  partner_confirmed_at timestamptz,
  reminder_sent_at timestamptz,
  auto_complete_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.completion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own completion requests
CREATE POLICY "Users can view own completion requests"
  ON public.completion_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = completion_requests.booking_id AND b.user_id = auth.uid()
  ));

-- Partners can view completion requests for their listings
CREATE POLICY "Partners can view their completion requests"
  ON public.completion_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.training_listings tl ON tl.id = b.listing_id
    JOIN public.partner_profiles pp ON pp.id = tl.partner_id
    WHERE b.id = completion_requests.booking_id AND pp.user_id = auth.uid()
  ));

-- Users can update their side
CREATE POLICY "Users can update own completion requests"
  ON public.completion_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = completion_requests.booking_id AND b.user_id = auth.uid()
  ));

-- Partners can update their side
CREATE POLICY "Partners can update their completion requests"
  ON public.completion_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.training_listings tl ON tl.id = b.listing_id
    JOIN public.partner_profiles pp ON pp.id = tl.partner_id
    WHERE b.id = completion_requests.booking_id AND pp.user_id = auth.uid()
  ));

-- Admins can manage all
CREATE POLICY "Admins can manage all completion requests"
  ON public.completion_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert (via service role or trigger)
CREATE POLICY "Authenticated users can create completion requests"
  ON public.completion_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = completion_requests.booking_id AND b.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.training_listings tl ON tl.id = b.listing_id
    JOIN public.partner_profiles pp ON pp.id = tl.partner_id
    WHERE b.id = completion_requests.booking_id AND pp.user_id = auth.uid()
  ));

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('user', 'partner')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reviewer_role)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews (public)
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Users can create reviews for their bookings
CREATE POLICY "Users can create reviews for own bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND (
      (reviewer_role = 'user' AND EXISTS (
        SELECT 1 FROM public.bookings b WHERE b.id = reviews.booking_id AND b.user_id = auth.uid() AND b.booking_status = 'completed'
      )) OR
      (reviewer_role = 'partner' AND EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.training_listings tl ON tl.id = b.listing_id
        JOIN public.partner_profiles pp ON pp.id = tl.partner_id
        WHERE b.id = reviews.booking_id AND pp.user_id = auth.uid() AND b.booking_status = 'completed'
      ))
    )
  );

-- Admins can manage reviews
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create session_issues table
CREATE TYPE public.issue_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

CREATE TABLE public.session_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reporter_role text NOT NULL CHECK (reporter_role IN ('user', 'partner')),
  reason text NOT NULL,
  note text,
  status issue_status NOT NULL DEFAULT 'open',
  admin_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_issues ENABLE ROW LEVEL SECURITY;

-- Reporters can view their own issues
CREATE POLICY "Users can view own issues"
  ON public.session_issues FOR SELECT
  USING (auth.uid() = reporter_id);

-- Reporters can create issues
CREATE POLICY "Users can create issues"
  ON public.session_issues FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can manage all issues
CREATE POLICY "Admins can manage all issues"
  ON public.session_issues FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add 'completed' and 'disputed' to booking_status if not already there
-- The existing enum has: pending, confirmed, cancelled, completed
-- We need to add 'disputed'
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'disputed';

-- Function to update partner stats when a review is created
CREATE OR REPLACE FUNCTION public.update_partner_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _avg numeric;
  _count integer;
BEGIN
  -- Get the partner_id for this booking
  SELECT tl.partner_id INTO _partner_id
  FROM bookings b
  JOIN training_listings tl ON tl.id = b.listing_id
  WHERE b.id = NEW.booking_id;

  IF _partner_id IS NULL THEN RETURN NEW; END IF;

  -- Only count reviews from users (not partner self-reviews)
  SELECT AVG(r.rating), COUNT(r.id) INTO _avg, _count
  FROM reviews r
  JOIN bookings b ON b.id = r.booking_id
  JOIN training_listings tl ON tl.id = b.listing_id
  WHERE tl.partner_id = _partner_id AND r.reviewer_role = 'user';

  UPDATE partner_profiles
  SET avg_rating = COALESCE(_avg, 0),
      review_count = COALESCE(_count, 0),
      updated_at = now()
  WHERE id = _partner_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_partner_stats
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_partner_stats();

-- Function to update completion/dispute rates
CREATE OR REPLACE FUNCTION public.update_partner_completion_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _total integer;
  _completed integer;
  _disputed integer;
BEGIN
  SELECT tl.partner_id INTO _partner_id
  FROM training_listings tl
  WHERE tl.id = NEW.listing_id;

  IF _partner_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO _total
  FROM bookings b
  JOIN training_listings tl ON tl.id = b.listing_id
  WHERE tl.partner_id = _partner_id AND b.booking_status IN ('completed', 'disputed');

  SELECT COUNT(*) INTO _completed
  FROM bookings b
  JOIN training_listings tl ON tl.id = b.listing_id
  WHERE tl.partner_id = _partner_id AND b.booking_status = 'completed';

  SELECT COUNT(*) INTO _disputed
  FROM bookings b
  JOIN training_listings tl ON tl.id = b.listing_id
  WHERE tl.partner_id = _partner_id AND b.booking_status = 'disputed';

  IF _total > 0 THEN
    UPDATE partner_profiles
    SET completion_rate = ROUND((_completed::numeric / _total) * 100, 1),
        dispute_rate = ROUND((_disputed::numeric / _total) * 100, 1),
        updated_at = now()
    WHERE id = _partner_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_partner_completion_stats
AFTER UPDATE OF booking_status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_partner_completion_stats();

-- Trigger for updated_at on new tables
CREATE TRIGGER update_completion_requests_updated_at
BEFORE UPDATE ON public.completion_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_issues_updated_at
BEFORE UPDATE ON public.session_issues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
