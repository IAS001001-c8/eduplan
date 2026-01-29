-- Add "eleve" to the user_role enum
-- First, we need to check if the enum exists and add the new value
DO $$ 
BEGIN
    -- Add 'eleve' to user_role enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'eleve' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'eleve';
    END IF;
END $$;

-- Add is_principal and principal_class_id columns to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS principal_class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_teachers_principal_class ON teachers(principal_class_id) WHERE is_principal = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN teachers.is_principal IS 'Indicates if the teacher is a Professeur Principal (PP)';
COMMENT ON COLUMN teachers.principal_class_id IS 'The class for which this teacher is the Professeur Principal';
