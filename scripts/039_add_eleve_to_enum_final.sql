-- Add "eleve" to the user_role enum type
-- This script must be executed in Supabase SQL Editor

-- First, check if "eleve" already exists in the enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'eleve'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- Add "eleve" to the enum
        ALTER TYPE user_role ADD VALUE 'eleve';
        RAISE NOTICE '"eleve" added to user_role enum';
    ELSE
        RAISE NOTICE '"eleve" already exists in user_role enum';
    END IF;
END
$$;

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
