-- Script complet pour ajouter TOUTES les colonnes manquantes dans la table students
-- Utilise IF NOT EXISTS pour éviter les erreurs si certaines colonnes existent déjà

DO $$ 
BEGIN
    -- Ajouter class_name (nom de la classe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_name') THEN
        ALTER TABLE students ADD COLUMN class_name VARCHAR(100);
        RAISE NOTICE 'Colonne class_name ajoutée';
    ELSE
        RAISE NOTICE 'Colonne class_name existe déjà';
    END IF;

    -- Ajouter role (rôle de l'étudiant: eleve, delegue, eco-delegue)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'role') THEN
        ALTER TABLE students ADD COLUMN role VARCHAR(50) DEFAULT 'eleve';
        RAISE NOTICE 'Colonne role ajoutée';
    ELSE
        RAISE NOTICE 'Colonne role existe déjà';
    END IF;

    -- Ajouter can_create_subrooms (autorisation de créer des sous-salles)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'can_create_subrooms') THEN
        ALTER TABLE students ADD COLUMN can_create_subrooms BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne can_create_subrooms ajoutée';
    ELSE
        RAISE NOTICE 'Colonne can_create_subrooms existe déjà';
    END IF;

    -- Ajouter establishment_id (lien vers l'établissement)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'establishment_id') THEN
        ALTER TABLE students ADD COLUMN establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne establishment_id ajoutée';
    ELSE
        RAISE NOTICE 'Colonne establishment_id existe déjà';
    END IF;

    -- Ajouter profile_id (lien vers le profil utilisateur pour les délégués)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'profile_id') THEN
        ALTER TABLE students ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Colonne profile_id ajoutée';
    ELSE
        RAISE NOTICE 'Colonne profile_id existe déjà';
    END IF;

    -- Ajouter email si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'email') THEN
        ALTER TABLE students ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Colonne email ajoutée';
    ELSE
        RAISE NOTICE 'Colonne email existe déjà';
    END IF;

    -- Ajouter phone si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'phone') THEN
        ALTER TABLE students ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Colonne phone ajoutée';
    ELSE
        RAISE NOTICE 'Colonne phone existe déjà';
    END IF;

END $$;

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_students_establishment_id ON students(establishment_id);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);

-- Vérification finale: afficher toutes les colonnes de la table students
SELECT 
    'Vérification: Colonnes de la table students' as message,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' AND table_schema = 'public'
ORDER BY ordinal_position;
