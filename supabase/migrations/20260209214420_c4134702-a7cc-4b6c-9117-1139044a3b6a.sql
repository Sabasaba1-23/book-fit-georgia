
-- Badge entity type enum
CREATE TYPE public.badge_entity_type AS ENUM ('trainer', 'studio', 'user');

-- Badge status enum
CREATE TYPE public.badge_status AS ENUM ('active', 'pending', 'revoked');

-- Badge source enum
CREATE TYPE public.badge_source AS ENUM ('manual_admin', 'auto_system');

-- Badge tier enum
CREATE TYPE public.badge_tier AS ENUM ('trust', 'experience', 'performance', 'loyalty');

-- Badge definitions table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'award',
  tier badge_tier NOT NULL,
  visibility_priority integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  auto_criteria jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Anyone can read active badges
CREATE POLICY "Anyone can view active badges"
  ON public.badges FOR SELECT
  USING (is_active = true);

-- Admins can manage badges
CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Entity badges (awarded badges)
CREATE TABLE public.entity_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type badge_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  badge_key text NOT NULL REFERENCES public.badges(key) ON DELETE CASCADE,
  status badge_status NOT NULL DEFAULT 'active',
  source badge_source NOT NULL DEFAULT 'auto_system',
  awarded_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  notes text,
  awarded_by uuid,
  UNIQUE (entity_type, entity_id, badge_key)
);

ALTER TABLE public.entity_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view active entity badges (public trust signal)
CREATE POLICY "Anyone can view active entity badges"
  ON public.entity_badges FOR SELECT
  USING (status = 'active');

-- Admins can manage all entity badges
CREATE POLICY "Admins can manage entity badges"
  ON public.entity_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Partners can view their own badges (including pending/revoked)
CREATE POLICY "Partners can view own badges"
  ON public.entity_badges FOR SELECT
  USING (
    (entity_type = 'trainer' OR entity_type = 'studio') AND
    EXISTS (
      SELECT 1 FROM partner_profiles pp
      WHERE pp.id = entity_badges.entity_id AND pp.user_id = auth.uid()
    )
  );

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON public.entity_badges FOR SELECT
  USING (
    entity_type = 'user' AND entity_id = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX idx_entity_badges_entity ON public.entity_badges (entity_type, entity_id);
CREATE INDEX idx_entity_badges_badge_key ON public.entity_badges (badge_key);
CREATE INDEX idx_entity_badges_status ON public.entity_badges (status);
