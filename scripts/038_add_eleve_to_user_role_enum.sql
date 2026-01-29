-- Add "eleve" to the user_role enum type
-- This allows students to be created without access to the application

-- First, check if the enum value already exists
DO $$
BEGIN
  -- Add "eleve" to the user_role enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'eleve' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'eleve';
    RAISE NOTICE 'Added "eleve" to user_role enum';
  ELSE
    RAISE NOTICE '"eleve" already exists in user_role enum';
  END IF;
END$$;

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
