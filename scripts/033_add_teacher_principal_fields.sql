-- Add Professeur Principal fields to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS principal_class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teachers_principal_class ON teachers(principal_class_id) WHERE is_principal = TRUE;

-- Add comment
COMMENT ON COLUMN teachers.is_principal IS 'Indicates if the teacher is a Professeur Principal (PP)';
COMMENT ON COLUMN teachers.principal_class_id IS 'The class for which this teacher is the Professeur Principal';

SELECT 'Professeur Principal fields added successfully!' as message;
