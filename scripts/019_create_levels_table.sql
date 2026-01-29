-- Create levels table for managing class levels (6ème, 5ème, 4ème, etc.)
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, establishment_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_levels_establishment ON levels(establishment_id);

-- Insert default levels for France
INSERT INTO levels (name, establishment_id, is_custom) 
SELECT '6ème', id, false FROM establishments WHERE NOT EXISTS (
  SELECT 1 FROM levels WHERE name = '6ème' AND establishment_id = establishments.id
);

INSERT INTO levels (name, establishment_id, is_custom) 
SELECT '5ème', id, false FROM establishments WHERE NOT EXISTS (
  SELECT 1 FROM levels WHERE name = '5ème' AND establishment_id = establishments.id
);

INSERT INTO levels (name, establishment_id, is_custom) 
SELECT '4ème', id, false FROM establishments WHERE NOT EXISTS (
  SELECT 1 FROM levels WHERE name = '4ème' AND establishment_id = establishments.id
);

INSERT INTO levels (name, establishment_id, is_custom) 
SELECT '3ème', id, false FROM establishments WHERE NOT EXISTS (
  SELECT 1 FROM levels WHERE name = '3ème' AND establishment_id = establishments.id
);

-- Create teacher_levels junction table
CREATE TABLE IF NOT EXISTS teacher_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, level_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_levels_teacher ON teacher_levels(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_levels_level ON teacher_levels(level_id);

-- Add level_id to students table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'level_id') THEN
    ALTER TABLE students ADD COLUMN level_id UUID REFERENCES levels(id);
  END IF;
END $$;

-- Add level_id to classes table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'level_id') THEN
    ALTER TABLE classes ADD COLUMN level_id UUID REFERENCES levels(id);
  END IF;
END $$;

SELECT 'Levels system created successfully!' as status, COUNT(*) as default_levels_created FROM levels;
