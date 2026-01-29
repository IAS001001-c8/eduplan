-- Drop old policies that reference can_create_subrooms
DROP POLICY IF EXISTS "Delegates can create proposals" ON sub_room_proposals;

-- Allow all delegates to create proposals (removed can_create_subrooms check)
CREATE POLICY "Delegates can create proposals"
  ON sub_room_proposals FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('eleve', 'delegate', 'eco-delegate')
    )
  );
