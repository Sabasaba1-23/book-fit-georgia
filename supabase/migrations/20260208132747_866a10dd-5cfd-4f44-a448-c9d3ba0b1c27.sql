
-- 1. Create partner_payouts table
CREATE TABLE public.partner_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_holder TEXT,
  iban TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own payouts" ON public.partner_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_payouts.partner_id AND pp.user_id = auth.uid())
  );

CREATE POLICY "Partners can insert own payouts" ON public.partner_payouts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_payouts.partner_id AND pp.user_id = auth.uid())
  );

CREATE POLICY "Partners can update own payouts" ON public.partner_payouts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_payouts.partner_id AND pp.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all payouts" ON public.partner_payouts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all payouts" ON public.partner_payouts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_partner_payouts_updated_at
  BEFORE UPDATE ON public.partner_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add gender columns
ALTER TABLE public.partner_profiles ADD COLUMN gender TEXT;
ALTER TABLE public.profiles ADD COLUMN gender TEXT;

-- 3. Add goals columns
ALTER TABLE public.training_listings ADD COLUMN goals TEXT[];
ALTER TABLE public.training_packages ADD COLUMN goals TEXT[];
