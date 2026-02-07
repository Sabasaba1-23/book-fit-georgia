
-- Add photos column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos text[] DEFAULT NULL;

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload review photos
CREATE POLICY "Users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-photos' AND auth.uid() IS NOT NULL);

-- Allow public read access to review photos
CREATE POLICY "Review photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

-- Allow users to delete their own review photos
CREATE POLICY "Users can delete own review photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
