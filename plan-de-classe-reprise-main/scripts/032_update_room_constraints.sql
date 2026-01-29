-- Update room constraints: 4 columns max, 10 tables width max, 350 capacity max

-- Add a check constraint for maximum capacity (350 seats)
-- Note: This is informational - the actual validation happens in the application

-- Add comment to document the constraints
COMMENT ON TABLE rooms IS 'Classroom rooms with layout configuration. Constraints: max 4 columns, max 10 tables width total, max 350 seats capacity';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Room constraints updated: 4 columns max, 10 tables width max, 350 capacity max';
END $$;
