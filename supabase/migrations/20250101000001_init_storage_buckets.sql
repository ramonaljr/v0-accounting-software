-- OpportunityOS Phase 1 - Storage Setup
-- Migration: Initialize storage buckets and policies
-- Created: 2025-10-21

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES
  ('receipts', 'receipts', false),
  ('invoices', 'invoices', false),
  ('documents', 'documents', false),
  ('exports', 'exports', false),
  ('avatars', 'avatars', true);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Receipts bucket policies
CREATE POLICY "Users can view receipts from their organizations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can upload receipts to their organizations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Invoices bucket policies
CREATE POLICY "Users can view invoices from their organizations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can upload invoices to their organizations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can delete invoices"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Documents bucket policies
CREATE POLICY "Users can view documents from their organizations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can upload documents to their organizations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Exports bucket policies
CREATE POLICY "Users can view exports from their organizations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports'
  );

CREATE POLICY "Users can delete their own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Avatars bucket policies (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view receipts from their organizations" ON storage.objects
  IS 'Allows org members to view receipts stored under their org_id folder';

COMMENT ON POLICY "Users can view invoices from their organizations" ON storage.objects
  IS 'Allows org members to view invoices stored under their org_id folder';

COMMENT ON POLICY "Users can view documents from their organizations" ON storage.objects
  IS 'Allows org members to view documents stored under their org_id folder';

COMMENT ON POLICY "Users can view exports from their organizations" ON storage.objects
  IS 'Allows org members to view exports stored under their org_id folder';
