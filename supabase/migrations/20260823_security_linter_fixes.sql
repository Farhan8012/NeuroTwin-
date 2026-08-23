-- ==============================================================================
-- Supabase Security Linter Fixes
-- Project Ref: jhsgxhotzowzjjoridzy
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Fix: public_bucket_allows_listing (Bucket: items)
-- Drop broad SELECT listing policy on storage.objects.
-- Public URLs will continue to work without exposing the bucket file listing.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access" ON storage.objects;


-- ------------------------------------------------------------------------------
-- 2. Fix: pg_graphql_anon_table_exposed & pg_graphql_authenticated_table_exposed
-- Hide tables from GraphQL schema reflection while keeping REST / PostgREST working.
-- ------------------------------------------------------------------------------
COMMENT ON TABLE public.ble_beacons IS '@graphql({"expose": false})';
COMMENT ON TABLE public.ble_rssi_log IS '@graphql({"expose": false})';
COMMENT ON TABLE public.emergency_contacts IS '@graphql({"expose": false})';
COMMENT ON TABLE public.medicines IS '@graphql({"expose": false})';
COMMENT ON TABLE public.memories IS '@graphql({"expose": false})';
COMMENT ON TABLE public.object_logs IS '@graphql({"expose": false})';
COMMENT ON TABLE public.patients IS '@graphql({"expose": false})';
COMMENT ON TABLE public.people IS '@graphql({"expose": false})';


-- ------------------------------------------------------------------------------
-- 3. Ensure Row Level Security (RLS) is enabled on all tables (Defense-in-Depth)
-- ------------------------------------------------------------------------------
ALTER TABLE public.ble_beacons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ble_rssi_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
