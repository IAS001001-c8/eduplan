-- ============================================
-- SCRIPT : Ajout UNIQUEMENT des colonnes manquantes
-- ============================================

-- 1. Ajouter board_position à rooms (colonne manquante critique)
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS board_position VARCHAR(20) DEFAULT 'top' CHECK (board_position IN ('top', 'bottom', 'left', 'right'));

-- 2. Ajouter config/layout à rooms pour stocker la configuration de la salle
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{"columns": []}';

-- 3. Ajouter created_by à rooms pour tracer qui a créé la salle
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Ajouter les colonnes manquantes dans students
ALTER TABLE students
ADD COLUMN IF NOT EXISTS class_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;

-- 5. Ajouter les colonnes manquantes dans teachers  
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS principal_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allow_delegate_subrooms BOOLEAN DEFAULT true;

-- 6. Ajouter establishment_id à sub_rooms si manquant
ALTER TABLE sub_rooms
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;

-- 7. Ajouter custom_name à sub_rooms
ALTER TABLE sub_rooms
ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255);

-- 8. Ajouter teacher_id à sub_rooms
ALTER TABLE sub_rooms
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- 9. Ajouter class_ids array à sub_rooms pour multi-classes
ALTER TABLE sub_rooms
ADD COLUMN IF NOT EXISTS class_ids UUID[];

-- 10. Ajouter is_multi_class à sub_rooms
ALTER TABLE sub_rooms
ADD COLUMN IF NOT EXISTS is_multi_class BOOLEAN DEFAULT false;

-- 11. Ajouter student_name à seating_assignments (pour affichage rapide)
ALTER TABLE seating_assignments
ADD COLUMN IF NOT EXISTS student_name TEXT;

-- 12. Ajouter seat_position à seating_assignments
ALTER TABLE seating_assignments
ADD COLUMN IF NOT EXISTS seat_position INTEGER;

-- 13. Ajouter is_active à room_shares
ALTER TABLE room_shares
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 14. Ajouter role et is_active à access_codes
ALTER TABLE access_codes
ADD COLUMN IF NOT EXISTS role VARCHAR(50) CHECK (role IN ('vie-scolaire', 'professeur', 'delegue', 'eco-delegue')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 15. Créer les index de performance manquants
CREATE INDEX IF NOT EXISTS idx_rooms_establishment ON rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_room ON sub_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_establishment ON sub_rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_created_by ON sub_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_sub_room ON seating_assignments(sub_room_id);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_student ON seating_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class ON teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_students_establishment ON students(establishment_id);

-- 16. Créer trigger pour updated_at sur rooms
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_rooms_updated_at ON sub_rooms;
CREATE TRIGGER update_sub_rooms_updated_at
  BEFORE UPDATE ON sub_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Message de confirmation
SELECT 'Colonnes manquantes ajoutées avec succès!' AS status;
