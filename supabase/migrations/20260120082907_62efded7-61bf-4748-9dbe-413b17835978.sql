-- Create storage bucket for service documents and proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-documents',
  'service-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Create storage bucket for portfolio/proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  52428800, -- 50MB limit for videos
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Allow public read access to service-documents
CREATE POLICY "Public read access for service documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-documents');

-- Allow authenticated users to upload to service-documents
CREATE POLICY "Users can upload service documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own service documents
CREATE POLICY "Users can delete their service documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to portfolio
CREATE POLICY "Public read access for portfolio"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

-- Allow authenticated users to upload to portfolio
CREATE POLICY "Users can upload portfolio items"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own portfolio items
CREATE POLICY "Users can delete their portfolio items"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);