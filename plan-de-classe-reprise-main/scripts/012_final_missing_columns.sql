-- Add missing columns to sub_rooms table
ALTER TABLE sub_rooms ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
ALTER TABLE sub_rooms ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;
ALTER TABLE sub_rooms ADD COLUMN IF NOT EXISTS seat_assignments jsonb DEFAULT '{}'::jsonb;
ALTER TABLE sub_rooms ADD COLUMN IF NOT EXISTS is_modifiable_by_delegates boolean DEFAULT true;
ALTER TABLE sub_rooms ADD COLUMN IF NOT EXISTS room_assignment_id uuid;

-- Create room_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS room_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  class_id uuid NOT NULL,
  class_name text NOT NULL,
  is_modifiable_by_delegates boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT room_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT room_assignments_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT room_assignments_unique UNIQUE (room_id, class_id)
);

-- Add foreign key for room_assignment_id in sub_rooms
ALTER TABLE sub_rooms ADD CONSTRAINT sub_rooms_room_assignment_id_fkey 
  FOREIGN KEY (room_assignment_id) REFERENCES room_assignments(id) ON DELETE CASCADE;

-- Add foreign key for room_shares pointing to sub_room_id (not room_assignment_id)
ALTER TABLE room_shares DROP CONSTRAINT IF EXISTS room_shares_sub_room_id_fkey;
ALTER TABLE room_shares ADD CONSTRAINT room_shares_sub_room_id_fkey 
  FOREIGN KEY (sub_room_id) REFERENCES sub_rooms(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_assignments_room_id ON room_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_room_assignments_class_id ON room_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_room_assignment_id ON sub_rooms(room_assignment_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_start_date ON sub_rooms(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sub_rooms_end_date ON sub_rooms(end_date) WHERE end_date IS NOT NULL;

-- Create updated_at trigger for room_assignments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_room_assignments_updated_at ON room_assignments;
CREATE TRIGGER update_room_assignments_updated_at 
  BEFORE UPDATE ON room_assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verification query
SELECT 
  'room_assignments' as table_name, 
  COUNT(*) as row_count 
FROM room_assignments
UNION ALL
SELECT 
  'sub_rooms with new columns' as info,
  COUNT(*) as count
FROM sub_rooms
WHERE start_date IS NOT NULL OR end_date IS NOT NULL OR seat_assignments IS NOT NULL;
