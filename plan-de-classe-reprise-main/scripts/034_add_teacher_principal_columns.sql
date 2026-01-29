-- Add is_principal and principal_class_id columns to teachers table
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS principal_class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_teachers_principal ON teachers(is_principal) WHERE is_principal = TRUE;
CREATE INDEX IF NOT EXISTS idx_teachers_principal_class ON teachers(principal_class_id) WHERE principal_class_id IS NOT NULL;
