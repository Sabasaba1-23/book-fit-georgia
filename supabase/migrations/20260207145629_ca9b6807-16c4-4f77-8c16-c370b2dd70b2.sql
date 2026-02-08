
-- Add phone_number to partner_profiles (required for new registrations)
ALTER TABLE public.partner_profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Create partner_verifications table for personal details
CREATE TABLE public.partner_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  date_of_birth date,
  address text,
  personal_id_number text,
  whatsapp text,
  social_instagram text,
  social_facebook text,
  social_tiktok text,
  admin_notes text,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(partner_id)
);

-- Enable RLS
ALTER TABLE public.partner_verifications ENABLE ROW LEVEL SECURITY;

-- Partners can view/update their own verification
CREATE POLICY "Partners can view own verification"
ON public.partner_verifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_verifications.partner_id AND pp.user_id = auth.uid()
));

CREATE POLICY "Partners can insert own verification"
ON public.partner_verifications FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_verifications.partner_id AND pp.user_id = auth.uid()
));

CREATE POLICY "Partners can update own verification"
ON public.partner_verifications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_verifications.partner_id AND pp.user_id = auth.uid()
));

-- Admins can do everything
CREATE POLICY "Admins can manage all verifications"
ON public.partner_verifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create partner_documents table
CREATE TABLE public.partner_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('id_card', 'passport', 'drivers_license')),
  document_url text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

-- Partners can view/insert own documents
CREATE POLICY "Partners can view own documents"
ON public.partner_documents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_documents.partner_id AND pp.user_id = auth.uid()
));

CREATE POLICY "Partners can upload documents"
ON public.partner_documents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_documents.partner_id AND pp.user_id = auth.uid()
));

CREATE POLICY "Partners can delete own documents"
ON public.partner_documents FOR DELETE
USING (EXISTS (
  SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_documents.partner_id AND pp.user_id = auth.uid()
));

-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents"
ON public.partner_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create private storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for partner-documents bucket
CREATE POLICY "Partners can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'partner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Partners can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Partners can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'partner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all partner documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_partner_verifications_updated_at
BEFORE UPDATE ON public.partner_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
