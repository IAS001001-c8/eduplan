-- Add board_position column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS board_position TEXT DEFAULT 'top' CHECK (board_position IN ('top', 'bottom', 'left', 'right'));

-- Update existing rooms to have a default board position
UPDATE rooms SET board_position = 'top' WHERE board_position IS NULL;

SELECT 'Board position column added successfully!' as message;
