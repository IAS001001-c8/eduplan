-- Add "eleve" to the user_role enum type
-- This script adds the "eleve" value to the user_role enum if it doesn't already exist

DO $$
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role' AND e.enumlabel = 'eleve'
    ) THEN
        -- Add the new enum value
        ALTER TYPE user_role ADD VALUE 'eleve';
        RAISE NOTICE 'Added "eleve" to user_role enum';
    ELSE
        RAISE NOTICE '"eleve" already exists in user_role enum';
    END IF;
END$$;
