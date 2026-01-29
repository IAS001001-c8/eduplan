-- Fix RLS policies to allow authentication queries
-- This allows anonymous users to query for authentication purposes

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "students_select_own_establishment" ON students;
DROP POLICY IF EXISTS "teachers_select_own_establishment" ON teachers;
DROP POLICY IF EXISTS "profiles_select_own_establishment" ON profiles;

-- Allow anonymous read access for authentication
-- Students table
CREATE POLICY "students_auth_read"
ON students FOR SELECT
TO anon
USING (true);

-- Teachers table
CREATE POLICY "teachers_auth_read"
ON teachers FOR SELECT
TO anon
USING (true);

-- Profiles table
CREATE POLICY "profiles_auth_read"
ON profiles FOR SELECT
TO anon
USING (true);

-- Establishments table (already should be readable)
CREATE POLICY "establishments_read_all"
ON establishments FOR SELECT
TO anon
USING (true);

-- Classes table (for dropdowns)
CREATE POLICY "classes_read_all"
ON classes FOR SELECT
TO anon
USING (true);

-- Update the password hash for the test user
UPDATE profiles 
SET password_hash = hash_password('Delegue2024!')
WHERE username = 'del.stmarie';

UPDATE students 
SET password_hash = hash_password('Delegue2024!')
WHERE username = 'del.stmarie';
