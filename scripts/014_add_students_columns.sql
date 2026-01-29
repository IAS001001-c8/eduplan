-- Add all missing columns to students table
-- These columns are required by the import students functionality

-- Add class_name if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'class_name') THEN
        ALTER TABLE students ADD COLUMN class_name VARCHAR(100);
    END IF;
END $$;

-- Add role if not exists (eleve, delegue, eco-delegue)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'role') THEN
        ALTER TABLE students ADD COLUMN role VARCHAR(50) DEFAULT 'eleve';
    END IF;
END $$;

-- Add can_create_subrooms if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'can_create_subrooms') THEN
        ALTER TABLE students ADD COLUMN can_create_subrooms BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add establishment_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'establishment_id') THEN
        ALTER TABLE students ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
END $$;

-- Add profile_id if not exists (link to profiles table for authentication)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'profile_id') THEN
        ALTER TABLE students ADD COLUMN profile_id UUID REFERENCES profiles(id);
    END IF;
END $$;

-- Create index on establishment_id for performance
CREATE INDEX IF NOT EXISTS idx_students_establishment ON students(establishment_id);

-- Create index on profile_id for performance
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);

-- Verify columns were added
SELECT 
    'students table columns' as info,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
