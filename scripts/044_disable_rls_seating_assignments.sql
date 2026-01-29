-- Disable RLS for seating_assignments table since the app uses custom auth (not Supabase auth)
-- The app will handle security at the application level

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view seating_assignments for their sub_rooms" ON seating_assignments;
DROP POLICY IF EXISTS "Users can insert seating_assignments for their sub_rooms" ON seating_assignments;
DROP POLICY IF EXISTS "Users can update seating_assignments for their sub_rooms" ON seating_assignments;
DROP POLICY IF EXISTS "Users can delete seating_assignments for their sub_rooms" ON seating_assignments;
DROP POLICY IF EXISTS "Users can manage seating_assignments for their sub_rooms" ON seating_assignments;

-- Disable RLS on seating_assignments table
ALTER TABLE seating_assignments DISABLE ROW LEVEL SECURITY;

-- Note: Security will be handled at the application level
-- Only authenticated users with proper roles can access the seating plan editor
