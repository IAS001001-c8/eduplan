-- Update students table to reference classes
ALTER TABLE students 
  DROP COLUMN IF EXISTS class CASCADE;

ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS can_create_subrooms BOOLEAN DEFAULT false;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Update teachers table to add subject and classes
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create teacher_classes junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, class_id)
);

-- Enable RLS
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_classes
CREATE POLICY "teacher_classes_select_own_establishment" ON teacher_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN profiles p ON t.establishment_id = p.establishment_id
      WHERE t.id = teacher_classes.teacher_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "teacher_classes_insert_vie_scolaire" ON teacher_classes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'vie-scolaire'
    )
  );

CREATE POLICY "teacher_classes_delete_vie_scolaire" ON teacher_classes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'vie-scolaire'
    )
  );

-- Update rooms table to add modifiable_by_delegates
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS modifiable_by_delegates BOOLEAN DEFAULT true;

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Generate share tokens for existing rooms
UPDATE rooms SET share_token = gen_random_uuid()::text WHERE share_token IS NULL;

-- Update sub_rooms table to add share_token
ALTER TABLE sub_rooms
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Generate share tokens for existing sub_rooms
UPDATE sub_rooms SET share_token = gen_random_uuid()::text WHERE share_token IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class ON teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_rooms_share_token ON rooms(share_token);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_share_token ON sub_rooms(share_token);
