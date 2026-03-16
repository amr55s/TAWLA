-- RLS Policies for the "menu-images" Storage Bucket
-- Run this in the Supabase SQL Editor after creating the bucket.
--
-- Prerequisites:
--   1. Go to Supabase Dashboard > Storage > New bucket
--   2. Name: menu-images, Public bucket: ON
--   3. Then run this SQL

-- Allow anyone to read images (guests need to see them)
CREATE POLICY "Public read menu-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'menu-images' );

-- Allow uploads (for testing: public; tighten with auth.role() = 'authenticated' later)
CREATE POLICY "Allow insert menu-images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'menu-images' );

-- Allow updates to existing files
CREATE POLICY "Allow update menu-images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'menu-images' );

-- Allow deleting files
CREATE POLICY "Allow delete menu-images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'menu-images' );
