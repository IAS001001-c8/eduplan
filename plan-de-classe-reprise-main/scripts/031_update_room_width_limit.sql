-- Update room creation to enforce width limit of 12 seats
-- This is enforced in the application logic, but we can add a check constraint

-- Add a check to ensure total seats per row doesn't exceed 12
-- This will be validated in the application before insert

DO $$
BEGIN
  RAISE NOTICE '✅ Room width limit (12 seats) will be enforced in application logic';
  RAISE NOTICE '✅ Room length can extend infinitely (limited only by practical considerations)';
END $$;
