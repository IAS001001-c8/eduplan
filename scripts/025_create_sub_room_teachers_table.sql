-- Création de la table pour le support multi-professeurs dans les sous-salles
CREATE TABLE IF NOT EXISTS sub_room_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id uuid NOT NULL REFERENCES sub_rooms(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sub_room_id, teacher_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sub_room_teachers_sub_room ON sub_room_teachers(sub_room_id);
CREATE INDEX IF NOT EXISTS idx_sub_room_teachers_teacher ON sub_room_teachers(teacher_id);

-- RLS : Les utilisateurs ne peuvent voir que les associations de leur établissement
ALTER TABLE sub_room_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sub_room_teachers from their establishment"
  ON sub_room_teachers FOR SELECT
  USING (
    sub_room_id IN (
      SELECT sr.id FROM sub_rooms sr
      JOIN rooms r ON sr.room_id = r.id
      WHERE r.establishment_id = (
        SELECT establishment_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage sub_room_teachers from their establishment"
  ON sub_room_teachers FOR ALL
  USING (
    sub_room_id IN (
      SELECT sr.id FROM sub_rooms sr
      JOIN rooms r ON sr.room_id = r.id
      WHERE r.establishment_id = (
        SELECT establishment_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Vérification
SELECT 'sub_room_teachers table created successfully!' as status;
