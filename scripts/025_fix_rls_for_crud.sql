-- Fix RLS policies to allow CRUD operations for authenticated users
-- This script enables INSERT, UPDATE, DELETE operations for all user roles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated insert on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated update on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated delete on profiles" ON profiles;

DROP POLICY IF EXISTS "Allow authenticated insert on students" ON students;
DROP POLICY IF EXISTS "Allow authenticated update on students" ON students;
DROP POLICY IF EXISTS "Allow authenticated delete on students" ON students;

DROP POLICY IF EXISTS "Allow authenticated insert on teachers" ON teachers;
DROP POLICY IF EXISTS "Allow authenticated update on teachers" ON teachers;
DROP POLICY IF EXISTS "Allow authenticated delete on teachers" ON teachers;

DROP POLICY IF EXISTS "Allow authenticated insert on classes" ON classes;
DROP POLICY IF EXISTS "Allow authenticated update on classes" ON classes;
DROP POLICY IF EXISTS "Allow authenticated delete on classes" ON classes;

DROP POLICY IF EXISTS "Allow authenticated insert on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated update on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated delete on rooms" ON rooms;

DROP POLICY IF EXISTS "Allow authenticated insert on sub_rooms" ON sub_rooms;
DROP POLICY IF EXISTS "Allow authenticated update on sub_rooms" ON sub_rooms;
DROP POLICY IF EXISTS "Allow authenticated delete on sub_rooms" ON sub_rooms;

DROP POLICY IF EXISTS "Allow authenticated insert on action_logs" ON action_logs;

-- Profiles table policies
CREATE POLICY "Allow authenticated insert on profiles"
ON profiles FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on profiles"
ON profiles FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on profiles"
ON profiles FOR DELETE
TO authenticated, anon
USING (true);

-- Students table policies
CREATE POLICY "Allow authenticated insert on students"
ON students FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on students"
ON students FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on students"
ON students FOR DELETE
TO authenticated, anon
USING (true);

-- Teachers table policies
CREATE POLICY "Allow authenticated insert on teachers"
ON teachers FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on teachers"
ON teachers FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on teachers"
ON teachers FOR DELETE
TO authenticated, anon
USING (true);

-- Classes table policies
CREATE POLICY "Allow authenticated insert on classes"
ON classes FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on classes"
ON classes FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on classes"
ON classes FOR DELETE
TO authenticated, anon
USING (true);

-- Rooms table policies
CREATE POLICY "Allow authenticated insert on rooms"
ON rooms FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on rooms"
ON rooms FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on rooms"
ON rooms FOR DELETE
TO authenticated, anon
USING (true);

-- Sub_rooms table policies
CREATE POLICY "Allow authenticated insert on sub_rooms"
ON sub_rooms FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sub_rooms"
ON sub_rooms FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on sub_rooms"
ON sub_rooms FOR DELETE
TO authenticated, anon
USING (true);

-- Action_logs table policies
CREATE POLICY "Allow authenticated insert on action_logs"
ON action_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Teacher_classes table policies
DROP POLICY IF EXISTS "Allow authenticated insert on teacher_classes" ON teacher_classes;
DROP POLICY IF EXISTS "Allow authenticated update on teacher_classes" ON teacher_classes;
DROP POLICY IF EXISTS "Allow authenticated delete on teacher_classes" ON teacher_classes;

CREATE POLICY "Allow authenticated insert on teacher_classes"
ON teacher_classes FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on teacher_classes"
ON teacher_classes FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on teacher_classes"
ON teacher_classes FOR DELETE
TO authenticated, anon
USING (true);

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
