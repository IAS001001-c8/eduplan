-- Comprehensive RLS Policy Fix for Rooms, Room Assignments, and Sub-Rooms
-- This script will fix all RLS issues preventing room creation

-- ============================================
-- ROOMS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "rooms_select_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_insert_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_update_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_delete_policy" ON rooms;

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT rooms (we'll filter by establishment in the app)
CREATE POLICY "rooms_select_policy" ON rooms
    FOR SELECT
    USING (true);

-- Allow anyone to INSERT rooms
CREATE POLICY "rooms_insert_policy" ON rooms
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to UPDATE rooms
CREATE POLICY "rooms_update_policy" ON rooms
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow anyone to DELETE rooms
CREATE POLICY "rooms_delete_policy" ON rooms
    FOR DELETE
    USING (true);

-- ============================================
-- ROOM_ASSIGNMENTS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "room_assignments_select_policy" ON room_assignments;
DROP POLICY IF EXISTS "room_assignments_insert_policy" ON room_assignments;
DROP POLICY IF EXISTS "room_assignments_update_policy" ON room_assignments;
DROP POLICY IF EXISTS "room_assignments_delete_policy" ON room_assignments;

-- Enable RLS on room_assignments table
ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT room_assignments
CREATE POLICY "room_assignments_select_policy" ON room_assignments
    FOR SELECT
    USING (true);

-- Allow anyone to INSERT room_assignments
CREATE POLICY "room_assignments_insert_policy" ON room_assignments
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to UPDATE room_assignments
CREATE POLICY "room_assignments_update_policy" ON room_assignments
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow anyone to DELETE room_assignments
CREATE POLICY "room_assignments_delete_policy" ON room_assignments
    FOR DELETE
    USING (true);

-- ============================================
-- SUB_ROOMS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sub_rooms_select_policy" ON sub_rooms;
DROP POLICY IF EXISTS "sub_rooms_insert_policy" ON sub_rooms;
DROP POLICY IF EXISTS "sub_rooms_update_policy" ON sub_rooms;
DROP POLICY IF EXISTS "sub_rooms_delete_policy" ON sub_rooms;

-- Enable RLS on sub_rooms table
ALTER TABLE sub_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT sub_rooms
CREATE POLICY "sub_rooms_select_policy" ON sub_rooms
    FOR SELECT
    USING (true);

-- Allow anyone to INSERT sub_rooms
CREATE POLICY "sub_rooms_insert_policy" ON sub_rooms
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to UPDATE sub_rooms
CREATE POLICY "sub_rooms_update_policy" ON sub_rooms
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow anyone to DELETE sub_rooms
CREATE POLICY "sub_rooms_delete_policy" ON sub_rooms
    FOR DELETE
    USING (true);

-- ============================================
-- ROOM_SHARES TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "room_shares_select_policy" ON room_shares;
DROP POLICY IF EXISTS "room_shares_insert_policy" ON room_shares;
DROP POLICY IF EXISTS "room_shares_update_policy" ON room_shares;
DROP POLICY IF EXISTS "room_shares_delete_policy" ON room_shares;

-- Enable RLS on room_shares table
ALTER TABLE room_shares ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT room_shares
CREATE POLICY "room_shares_select_policy" ON room_shares
    FOR SELECT
    USING (true);

-- Allow anyone to INSERT room_shares
CREATE POLICY "room_shares_insert_policy" ON room_shares
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to UPDATE room_shares
CREATE POLICY "room_shares_update_policy" ON room_shares
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow anyone to DELETE room_shares
CREATE POLICY "room_shares_delete_policy" ON room_shares
    FOR DELETE
    USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies successfully updated for rooms, room_assignments, sub_rooms, and room_shares tables';
    RAISE NOTICE '✅ All users can now create, read, update, and delete rooms and related data';
END $$;
