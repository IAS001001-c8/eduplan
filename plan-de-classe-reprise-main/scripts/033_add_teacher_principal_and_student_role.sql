-- Add Professeur Principal fields to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS principal_class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teachers_principal_class ON teachers(principal_class_id) WHERE is_principal = TRUE;

-- Add comment
COMMENT ON COLUMN teachers.is_principal IS 'Indicates if the teacher is a Professeur Principal (PP)';
COMMENT ON COLUMN teachers.principal_class_id IS 'The class for which this teacher is the Professeur Principal';

-- Update students table to allow null profile_id for "élève" role
ALTER TABLE students 
ALTER COLUMN profile_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN students.profile_id IS 'Profile ID for students with access (délégué, éco-délégué). NULL for regular students (élève)';

SELECT 'Teacher Principal and Student role fields updated successfully!' as message;
