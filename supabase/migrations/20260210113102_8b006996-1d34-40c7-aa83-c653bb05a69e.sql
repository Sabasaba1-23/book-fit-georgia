
-- Create partner_subscriptions table
CREATE TABLE public.partner_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id)
);

-- Enable RLS
ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;

-- Partners can view their own subscription
CREATE POLICY "Partners can view own subscription"
  ON public.partner_subscriptions FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Partners can insert their own subscription
CREATE POLICY "Partners can insert own subscription"
  ON public.partner_subscriptions FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Partners can update their own subscription
CREATE POLICY "Partners can update own subscription"
  ON public.partner_subscriptions FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON public.partner_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_partner_subscriptions_updated_at
  BEFORE UPDATE ON public.partner_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
