-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT,
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(name, establishment_id)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policies for classes
CREATE POLICY "classes_select_own_establishment" ON classes
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "classes_insert_vie_scolaire" ON classes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'vie-scolaire'
      AND establishment_id = classes.establishment_id
    )
  );

CREATE POLICY "classes_update_vie_scolaire" ON classes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'vie-scolaire'
      AND establishment_id = classes.establishment_id
    )
  );

CREATE POLICY "classes_delete_vie_scolaire" ON classes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'vie-scolaire'
      AND establishment_id = classes.establishment_id
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_classes_establishment ON classes(establishment_id);
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
