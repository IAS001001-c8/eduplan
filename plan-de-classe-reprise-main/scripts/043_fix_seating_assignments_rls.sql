-- Fix RLS policies for seating_assignments table
-- The issue is that INSERT needs WITH CHECK clause, not just USING clause

DROP POLICY IF EXISTS "Users can manage seating_assignments for their sub_rooms" ON seating_assignments;

-- Separate policies for different operations
CREATE POLICY "Users can view seating_assignments for their sub_rooms"
  ON seating_assignments FOR SELECT
  USING (
    sub_room_id IN (
      SELECT id FROM sub_rooms 
      WHERE establishment_id IN (
        SELECT establishment_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert seating_assignments for their sub_rooms"
  ON seating_assignments FOR INSERT
  WITH CHECK (
    sub_room_id IN (
      SELECT id FROM sub_rooms WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update seating_assignments for their sub_rooms"
  ON seating_assignments FOR UPDATE
  USING (
    sub_room_id IN (
      SELECT id FROM sub_rooms WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete seating_assignments for their sub_rooms"
  ON seating_assignments FOR DELETE
  USING (
    sub_room_id IN (
      SELECT id FROM sub_rooms WHERE created_by = auth.uid()
    )
  );
