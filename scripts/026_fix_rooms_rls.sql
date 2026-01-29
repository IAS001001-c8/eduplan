-- Fix RLS policies for rooms table to allow CRUD operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read for rooms" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated insert for rooms" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated update for rooms" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated delete for rooms" ON rooms;

-- Create new policies that allow all operations
CREATE POLICY "Allow all read for rooms"
ON rooms FOR SELECT
USING (true);

CREATE POLICY "Allow all insert for rooms"
ON rooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all update for rooms"
ON rooms FOR UPDATE
USING (true);

CREATE POLICY "Allow all delete for rooms"
ON rooms FOR DELETE
USING (true);

-- Also fix room_assignments table
DROP POLICY IF EXISTS "Allow all read for room_assignments" ON room_assignments;
DROP POLICY IF EXISTS "Allow all insert for room_assignments" ON room_assignments;
DROP POLICY IF EXISTS "Allow all update for room_assignments" ON room_assignments;
DROP POLICY IF EXISTS "Allow all delete for room_assignments" ON room_assignments;

CREATE POLICY "Allow all read for room_assignments"
ON room_assignments FOR SELECT
USING (true);

CREATE POLICY "Allow all insert for room_assignments"
ON room_assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all update for room_assignments"
ON room_assignments FOR UPDATE
USING (true);

CREATE POLICY "Allow all delete for room_assignments"
ON room_assignments FOR DELETE
USING (true);

SELECT 'RLS policies for rooms and room_assignments updated successfully!' as message;
