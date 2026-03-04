-- Run in Supabase SQL Editor as postgres

INSERT INTO storage.buckets (id, name, public)
VALUES ('el-castillo', 'el-castillo', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_upload'
  ) THEN
    EXECUTE 'CREATE POLICY authenticated_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''el-castillo'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_update'
  ) THEN
    EXECUTE 'CREATE POLICY authenticated_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''el-castillo'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_read'
  ) THEN
    EXECUTE 'CREATE POLICY public_read ON storage.objects FOR SELECT TO public USING (bucket_id = ''el-castillo'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_delete'
  ) THEN
    EXECUTE 'CREATE POLICY authenticated_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''el-castillo'')';
  END IF;
END $$;
