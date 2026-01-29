-- ============================================
-- SCRIPT COMPLET : Ajout de toutes les colonnes et fonctionnalités manquantes
-- ============================================

-- 1. Ajout des colonnes manquantes dans la table 'classes'
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;

-- 2. Ajout des colonnes manquantes dans la table 'students'
ALTER TABLE students
ADD COLUMN IF NOT EXISTS class_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'eleve',
ADD COLUMN IF NOT EXISTS can_create_subrooms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 3. Ajout des colonnes manquantes dans la table 'teachers'
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS principal_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allow_delegate_subrooms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. S'assurer que la table 'rooms' existe et a toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  board_position VARCHAR(20) DEFAULT 'top' CHECK (board_position IN ('top', 'bottom', 'left', 'right')),
  config JSONB NOT NULL DEFAULT '{"columns": []}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(establishment_id, code)
);

-- 5. S'assurer que la table 'sub_rooms' existe et a toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS sub_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  custom_name VARCHAR(255),
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  class_ids UUID[] NOT NULL DEFAULT '{}',
  is_multi_class BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type VARCHAR(20) DEFAULT 'temporary' CHECK (type IN ('temporary', 'indeterminate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. S'assurer que la table 'seating_assignments' existe
CREATE TABLE IF NOT EXISTS seating_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id UUID NOT NULL REFERENCES sub_rooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  seat_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sub_room_id, seat_position),
  UNIQUE(sub_room_id, student_id)
);

-- 7. S'assurer que la table 'room_shares' existe
CREATE TABLE IF NOT EXISTS room_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id UUID NOT NULL REFERENCES sub_rooms(id) ON DELETE CASCADE,
  share_token VARCHAR(255) NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- 8. S'assurer que la table 'access_codes' existe
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('vie-scolaire', 'professeur', 'delegue', 'eco-delegue')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 9. S'assurer que la table 'teacher_classes' existe
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, class_id)
);

-- 10. S'assurer que la table 'action_logs' existe
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_classes_establishment ON classes(establishment_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_establishment ON students(establishment_id);
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_teachers_establishment ON teachers(establishment_id);
CREATE INDEX IF NOT EXISTS idx_teachers_profile ON teachers(profile_id);
CREATE INDEX IF NOT EXISTS idx_rooms_establishment ON rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_room ON sub_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_establishment ON sub_rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_sub_room ON seating_assignments(sub_room_id);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_student ON seating_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class ON teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_action_logs_establishment ON action_logs(establishment_id);

-- 12. Créer les triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers sur toutes les tables pertinentes
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

DROP TRIGGER IF EXISTS update_seating_assignments_updated_at ON seating_assignments;
CREATE TRIGGER update_seating_assignments_updated_at
  BEFORE UPDATE ON seating_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. Vérification finale
SELECT 
  'classes' AS table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'students' AS table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'students' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'teachers' AS table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'teachers' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'rooms' AS table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'rooms' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'sub_rooms' AS table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'sub_rooms' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Message de confirmation
SELECT 
  'Toutes les tables et colonnes ont été créées/mises à jour avec succès !' AS status,
  COUNT(DISTINCT table_name) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
