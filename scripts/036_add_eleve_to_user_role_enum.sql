-- Add "eleve" to the user_role enum
DO $$ 
BEGIN
    -- Check if 'eleve' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'eleve' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- Add 'eleve' to the enum
        ALTER TYPE user_role ADD VALUE 'eleve';
    END IF;
END $$;

-- Update students table to allow null profile_id for "eleve" role
ALTER TABLE students ALTER COLUMN profile_id DROP NOT NULL;

-- Add comment
COMMENT ON TYPE user_role IS 'User roles: vie-scolaire, professeur, delegue, eco-delegue, eleve';
