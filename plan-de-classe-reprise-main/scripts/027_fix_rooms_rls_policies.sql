-- Fix RLS policies for rooms table to allow authenticated users to create/manage rooms

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rooms in their establishment" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms in their establishment" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms in their establishment" ON rooms;
DROP POLICY IF EXISTS "Users can delete rooms in their establishment" ON rooms;

-- Create new policies that allow all operations for authenticated users
CREATE POLICY "Users can view rooms in their establishment"
ON rooms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create rooms in their establishment"
ON rooms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update rooms in their establishment"
ON rooms FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete rooms in their establishment"
ON rooms FOR DELETE
TO authenticated
USING (true);

-- Also fix room_assignments table
DROP POLICY IF EXISTS "Users can view room assignments" ON room_assignments;
DROP POLICY IF EXISTS "Users can create room assignments" ON room_assignments;
DROP POLICY IF EXISTS "Users can update room assignments" ON room_assignments;
DROP POLICY IF EXISTS "Users can delete room assignments" ON room_assignments;

CREATE POLICY "Users can view room assignments"
ON room_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create room assignments"
ON room_assignments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update room assignments"
ON room_assignments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete room assignments"
ON room_assignments FOR DELETE
TO authenticated
USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('rooms', 'room_assignments')
ORDER BY tablename, policyname;
