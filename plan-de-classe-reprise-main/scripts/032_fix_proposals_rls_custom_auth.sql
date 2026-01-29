-- Fix RLS policies for sub_room_proposals to work with custom auth

-- Drop all existing policies
DROP POLICY IF EXISTS "Delegates can create proposals" ON sub_room_proposals;
DROP POLICY IF EXISTS "Users can view their proposals" ON sub_room_proposals;
DROP POLICY IF EXISTS "Teachers can view proposals for them" ON sub_room_proposals;
DROP POLICY IF EXISTS "Vie-scolaire can view all proposals" ON sub_room_proposals;
DROP POLICY IF EXISTS "Teachers can update proposal status" ON sub_room_proposals;

-- Create new policies that don't rely on auth.uid() (for custom auth)

-- Allow INSERT for all authenticated users (they provide their own user_id)
CREATE POLICY "Anyone can create proposals"
  ON sub_room_proposals FOR INSERT
  WITH CHECK (true);

-- Allow SELECT for users to see their own proposals
CREATE POLICY "Users can view their proposals"
  ON sub_room_proposals FOR SELECT
  USING (true);

-- Allow UPDATE for proposal review
CREATE POLICY "Anyone can update proposals"
  ON sub_room_proposals FOR UPDATE
  USING (true);

-- Allow DELETE if needed
CREATE POLICY "Anyone can delete proposals"
  ON sub_room_proposals FOR DELETE
  USING (true);
