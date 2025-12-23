-- Storage Bucket RLS Policies for redi-fleet bucket
-- Run this in your Supabase SQL Editor to allow users to upload profile images
-- 
-- IMPORTANT: Since your app uses phone-based authentication without Supabase Auth sessions,
-- you'll need to use the "public upload" policies below, OR set up proper Supabase Auth.

-- Step 1: Ensure the bucket exists and is configured
-- Go to: Supabase Dashboard > Storage > Buckets
-- Create bucket named 'redi-fleet' if it doesn't exist
-- Set it to PUBLIC if you want public read access

-- Step 2: Run these SQL policies in Supabase SQL Editor

-- ============================================
-- OPTION 1: Public Upload (Recommended for phone auth)
-- ============================================
-- This allows anyone to upload to profiles/ folder
-- Since file names include user IDs, it's reasonably secure

-- Allow public uploads to profiles folder
CREATE POLICY "Allow public uploads to profiles folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Allow public read access to profile images
CREATE POLICY "Allow public read access to profile images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Allow public updates (for upsert functionality)
CREATE POLICY "Allow public updates to profile images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Allow public deletes (optional - remove if you don't want deletes)
CREATE POLICY "Allow public deletes to profile images"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- ============================================
-- ASSET IMAGES POLICIES (for multiple asset photos)
-- ============================================
-- Allow public uploads to assets folder
CREATE POLICY "Allow public uploads to assets folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'assets'
);

-- Allow public read access to asset images
CREATE POLICY "Allow public read access to asset images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'assets'
);

-- Allow public updates to asset images
CREATE POLICY "Allow public updates to asset images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'assets'
);

-- Allow public deletes to asset images
CREATE POLICY "Allow public deletes to asset images"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'assets'
);

-- ============================================
-- OPTION 2: Authenticated Users Only (If using Supabase Auth)
-- ============================================
-- Uncomment these if you switch to proper Supabase Auth sessions
/*
-- Policy: Allow authenticated users to upload files to profiles/ folder
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Policy: Allow authenticated users to update their own profile images
CREATE POLICY "Allow authenticated users to update profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Policy: Allow public read access to profile images
CREATE POLICY "Allow public read access to profile images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Policy: Allow authenticated users to delete their own profile images
CREATE POLICY "Allow authenticated users to delete profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'redi-fleet' 
  AND (storage.foldername(name))[1] = 'profiles'
);
*/

-- ============================================
-- NOTES:
-- ============================================
-- 1. If you get "policy already exists" errors, drop the existing policies first:
--    DROP POLICY IF EXISTS "Allow public uploads to profiles folder" ON storage.objects;
--    DROP POLICY IF EXISTS "Allow public uploads to assets folder" ON storage.objects;
--
-- 2. To check existing policies:
--    SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
--
-- 3. To drop all asset-related policies if needed:
--    DROP POLICY IF EXISTS "Allow public uploads to assets folder" ON storage.objects;
--    DROP POLICY IF EXISTS "Allow public read access to asset images" ON storage.objects;
--    DROP POLICY IF EXISTS "Allow public updates to asset images" ON storage.objects;
--    DROP POLICY IF EXISTS "Allow public deletes to asset images" ON storage.objects;
--
-- 4. For better security with phone auth, consider:
--    - Creating a backend API endpoint that uses service role key
--    - Implementing proper Supabase Auth for phone users
--    - Adding file size/type validation in your app

