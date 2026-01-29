-- Add draft/submitted status and update table structure
ALTER TABLE sub_room_proposals
ADD COLUMN IF NOT EXISTS is_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS seat_assignments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments text;

-- Update status check to include draft
ALTER TABLE sub_room_proposals 
DROP CONSTRAINT IF EXISTS sub_room_proposals_status_check;

ALTER TABLE sub_room_proposals
ADD CONSTRAINT sub_room_proposals_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- Allow re-submission after rejection by setting status back to pending
CREATE OR REPLACE FUNCTION allow_resubmission()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes from rejected to pending, clear rejection data
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resubmission_trigger ON sub_room_proposals;
CREATE TRIGGER resubmission_trigger
  BEFORE UPDATE ON sub_room_proposals
  FOR EACH ROW
  EXECUTE FUNCTION allow_resubmission();

-- Update RLS to allow delegates to update their proposals
DROP POLICY IF EXISTS "Delegates can update their proposals" ON sub_room_proposals;
CREATE POLICY "Delegates can update their proposals"
  ON sub_room_proposals FOR UPDATE
  USING (proposed_by IN (SELECT id FROM profiles WHERE id = proposed_by));
