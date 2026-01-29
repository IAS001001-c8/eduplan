-- Add missing 'level' column to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS level VARCHAR(50);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;
