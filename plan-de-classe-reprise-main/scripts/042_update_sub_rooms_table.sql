-- Update existing sub_rooms table to add missing columns for seating plans
ALTER TABLE sub_rooms 
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS custom_name TEXT,
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_multi_class BOOLEAN DEFAULT FALSE;

-- Update existing rows to have establishment_id from created_by profile
UPDATE sub_rooms 
SET establishment_id = (
  SELECT establishment_id FROM profiles WHERE id = sub_rooms.created_by
)
WHERE establishment_id IS NULL;

-- Make establishment_id NOT NULL after populating it
ALTER TABLE sub_rooms 
ALTER COLUMN establishment_id SET NOT NULL;

-- Create seating_assignments table for student seat positions
CREATE TABLE IF NOT EXISTS seating_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id UUID NOT NULL REFERENCES sub_rooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  seat_position JSONB NOT NULL, -- {column: 0, table: 0, seat: 0, seatNumber: 1}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sub_room_id, student_id)
);

-- Add allow_delegate_subrooms field to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS allow_delegate_subrooms BOOLEAN DEFAULT TRUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_rooms_establishment ON sub_rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_room ON sub_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_teacher ON sub_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_created_by ON sub_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_sub_room ON seating_assignments(sub_room_id);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_student ON seating_assignments(student_id);

-- Enable RLS on seating_assignments (sub_rooms already has RLS enabled)
ALTER TABLE seating_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies on sub_rooms if they exist
DROP POLICY IF EXISTS "Users can view sub_rooms in their establishment" ON sub_rooms;
DROP POLICY IF EXISTS "Vie-scolaire can insert sub_rooms" ON sub_rooms;
DROP POLICY IF EXISTS "Teachers can insert sub_rooms for their classes" ON sub_rooms;
DROP POLICY IF EXISTS "Delegates can insert sub_rooms for their teachers" ON sub_rooms;
DROP POLICY IF EXISTS "Users can update their own sub_rooms" ON sub_rooms;
DROP POLICY IF EXISTS "Users can delete their own sub_rooms" ON sub_rooms;

-- RLS policies for sub_rooms
CREATE POLICY "Users can view sub_rooms in their establishment"
  ON sub_rooms FOR SELECT
  USING (
    establishment_id IN (
      SELECT establishment_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vie-scolaire can insert sub_rooms"
  ON sub_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'vie-scolaire'
      AND establishment_id = sub_rooms.establishment_id
    )
  );

CREATE POLICY "Teachers can insert sub_rooms for their classes"
  ON sub_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'professeur'
      AND establishment_id = sub_rooms.establishment_id
    )
    AND teacher_id = (SELECT id FROM teachers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Delegates can insert sub_rooms for their teachers"
  ON sub_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('delegue', 'eco-delegue')
      AND establishment_id = sub_rooms.establishment_id
    )
    AND teacher_id IN (
      SELECT t.id FROM teachers t
      JOIN teacher_classes tc ON t.id = tc.teacher_id
      JOIN students s ON s.class_id = tc.class_id
      WHERE s.profile_id = auth.uid()
      AND t.allow_delegate_subrooms = TRUE
    )
  );

CREATE POLICY "Users can update their own sub_rooms"
  ON sub_rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own sub_rooms"
  ON sub_rooms FOR DELETE
  USING (created_by = auth.uid());

-- RLS policies for seating_assignments
CREATE POLICY "Users can view seating_assignments in their establishment"
  ON seating_assignments FOR SELECT
  USING (
    sub_room_id IN (
      SELECT id FROM sub_rooms 
      WHERE establishment_id IN (
        SELECT establishment_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage seating_assignments for their sub_rooms"
  ON seating_assignments FOR ALL
  USING (
    sub_room_id IN (
      SELECT id FROM sub_rooms WHERE created_by = auth.uid()
    )
  );

COMMENT ON TABLE seating_assignments IS 'Student seat assignments in sub-rooms';
COMMENT ON COLUMN teachers.allow_delegate_subrooms IS 'Allow delegates to create sub-rooms for this teacher';
