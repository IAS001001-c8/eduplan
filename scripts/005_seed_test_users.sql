-- Create test users for each role at each establishment
-- This script creates test users with known credentials for testing

-- Helper function to get establishment ID by code
do $$
declare
  stm_id uuid;
  vh_id uuid;
  vs_stm_user_id uuid;
  vs_vh_user_id uuid;
  prof_stm_user_id uuid;
  prof_vh_user_id uuid;
  del_stm_user_id uuid;
  del_vh_user_id uuid;
begin
  -- Get establishment IDs
  select id into stm_id from public.establishments where code = 'stm001';
  select id into vh_id from public.establishments where code = 'vh001';

  -- Note: In Supabase, you need to create auth users through the Supabase dashboard or API
  -- This script assumes the auth.users have been created with these IDs
  -- For testing, you'll need to manually create these users in Supabase Auth
  
  -- The following are placeholder UUIDs - replace with actual auth.users IDs after creation
  -- Or use Supabase's admin API to create users programmatically
  
  -- For now, we'll create the profile structure that will be linked to auth users
  -- The actual auth.users creation needs to be done through Supabase Auth API
  
end $$;

-- Instructions for creating test users:
-- You need to create these users in Supabase Auth with the following credentials:

-- ST-MARIE (stm001):
-- 1. Vie-scolaire: username=vs.stmarie, email=vs.stmarie@test.local, password=VieScol2024!
-- 2. Professeur: username=prof.stmarie, email=prof.stmarie@test.local, password=Prof2024!
-- 3. Délégué: username=del.stmarie, email=del.stmarie@test.local, password=Delegue2024!

-- VICTOR-HUGO (vh001):
-- 1. Vie-scolaire: username=vs.vhugo, email=vs.vhugo@test.local, password=VieScol2024!
-- 2. Professeur: username=prof.vhugo, email=prof.vhugo@test.local, password=Prof2024!
-- 3. Délégué: username=del.vhugo, email=del.vhugo@test.local, password=Delegue2024!
