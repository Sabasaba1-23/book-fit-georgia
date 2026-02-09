
-- ═══════════════════════════════════════════════════════
-- GYM ↔ TRAINER LINKING TABLE
-- Gyms can add trainers; trainers can remove themselves
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.gym_trainers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  trainer_partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(gym_partner_id, trainer_partner_id)
);

ALTER TABLE public.gym_trainers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active gym-trainer links (public profile data)
CREATE POLICY "Anyone can view active gym-trainer links"
  ON public.gym_trainers FOR SELECT
  USING (status = 'active');

-- Gym partners can add trainers
CREATE POLICY "Gym partners can add trainers"
  ON public.gym_trainers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = gym_trainers.gym_partner_id
        AND pp.user_id = auth.uid()
        AND pp.partner_type = 'gym'
    )
  );

-- Gym partners can update/remove their own trainer links
CREATE POLICY "Gym partners can manage own trainer links"
  ON public.gym_trainers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = gym_trainers.gym_partner_id
        AND pp.user_id = auth.uid()
        AND pp.partner_type = 'gym'
    )
  );

CREATE POLICY "Gym partners can delete own trainer links"
  ON public.gym_trainers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = gym_trainers.gym_partner_id
        AND pp.user_id = auth.uid()
        AND pp.partner_type = 'gym'
    )
  );

-- Trainers can remove themselves (update status to 'removed')
CREATE POLICY "Trainers can remove themselves from gyms"
  ON public.gym_trainers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = gym_trainers.trainer_partner_id
        AND pp.user_id = auth.uid()
        AND pp.partner_type = 'individual'
    )
  );

-- Trainers can view their own links
CREATE POLICY "Trainers can view own gym links"
  ON public.gym_trainers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = gym_trainers.trainer_partner_id
        AND pp.user_id = auth.uid()
    )
  );

-- Admins can manage all
CREATE POLICY "Admins can manage gym trainers"
  ON public.gym_trainers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════
-- PARTNER LOCATIONS (multi-location support)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.partner_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  description text,
  latitude double precision,
  longitude double precision,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can view locations of approved partners
CREATE POLICY "Anyone can view partner locations"
  ON public.partner_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = partner_locations.partner_id
        AND pp.approved = true
    )
  );

-- Partners can manage own locations
CREATE POLICY "Partners can insert own locations"
  ON public.partner_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = partner_locations.partner_id
        AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update own locations"
  ON public.partner_locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = partner_locations.partner_id
        AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can delete own locations"
  ON public.partner_locations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = partner_locations.partner_id
        AND pp.user_id = auth.uid()
    )
  );

-- Partners can view own locations
CREATE POLICY "Partners can view own locations"
  ON public.partner_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = partner_locations.partner_id
        AND pp.user_id = auth.uid()
    )
  );

-- Admins can manage all locations
CREATE POLICY "Admins can manage partner locations"
  ON public.partner_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'));
