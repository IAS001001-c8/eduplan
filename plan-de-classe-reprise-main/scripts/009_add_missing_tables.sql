-- Script pour ajouter toutes les tables et colonnes manquantes
-- Basé sur l'analyse du code vs le schéma actuel

-- 1. Ajouter establishment_id à la table classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES establishments(id);

-- 2. Créer la table rooms (salles)
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id),
  name text NOT NULL,
  code text NOT NULL,
  capacity integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- 3. Créer la table sub_rooms (sous-salles)
CREATE TABLE IF NOT EXISTS sub_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  name text NOT NULL,
  type text CHECK (type IN ('temporary', 'indeterminate')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- 4. Créer la table room_shares (partages de salles)
CREATE TABLE IF NOT EXISTS room_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id uuid REFERENCES sub_rooms(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  created_by uuid REFERENCES profiles(id),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Créer la table seating_assignments (affectations de places)  
CREATE TABLE IF NOT EXISTS seating_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_room_id uuid REFERENCES sub_rooms(id) ON DELETE CASCADE,
  seat_id text NOT NULL,
  student_id uuid REFERENCES students(id),
  student_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Créer la table access_codes (codes d'accès - si nécessaire pour l'ancien système)
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  profile_id uuid REFERENCES profiles(id),
  establishment_id uuid REFERENCES establishments(id),
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_classes_establishment_id ON classes(establishment_id);
CREATE INDEX IF NOT EXISTS idx_rooms_establishment_id ON rooms(establishment_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_room_id ON sub_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_sub_rooms_class_id ON sub_rooms(class_id);
CREATE INDEX IF NOT EXISTS idx_seating_assignments_sub_room_id ON seating_assignments(sub_room_id);
CREATE INDEX IF NOT EXISTS idx_room_shares_share_token ON room_shares(share_token);

-- Vérification : Afficher toutes les tables créées
SELECT 'Tables créées avec succès!' as message;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
