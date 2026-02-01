-- =====================================================
-- SCRIPT SQL - Fonctionnalité EBP (Élèves à Besoins Particuliers)
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- 1. Ajouter la colonne gender à la table students
-- Format: 1 = Homme, 2 = Femme, 3 = Non identifié
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS gender smallint CHECK (gender IN (1, 2, 3));

-- 2. Ajouter la colonne special_needs (array de codes de besoins)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS special_needs text[] DEFAULT '{}';

-- 3. Créer la table des besoins particuliers personnalisés par établissement
CREATE TABLE IF NOT EXISTS public.establishment_special_needs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT establishment_special_needs_pkey PRIMARY KEY (id),
  CONSTRAINT establishment_special_needs_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE,
  CONSTRAINT establishment_special_needs_unique UNIQUE (establishment_id, code)
);

-- 4. Désactiver RLS pour cette table (auth custom)
ALTER TABLE public.establishment_special_needs DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to establishment_special_needs"
  ON public.establishment_special_needs FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.establishment_special_needs ENABLE ROW LEVEL SECURITY;

-- 5. Insérer les besoins par défaut pour tous les établissements existants
-- Cette fonction sera appelée pour chaque établissement
CREATE OR REPLACE FUNCTION insert_default_special_needs(est_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.establishment_special_needs (establishment_id, code, label, description, is_default, display_order)
  VALUES
    (est_id, 'PAP', 'PAP', 'Plan d''Accompagnement Personnalisé', true, 1),
    (est_id, 'PAI', 'PAI', 'Projet d''Accueil Individualisé', true, 2),
    (est_id, 'TDAH', 'TDAH', 'Trouble Déficit de l''Attention avec ou sans Hyperactivité', true, 3),
    (est_id, 'VUE', 'Problèmes de vue avérés', 'Difficultés visuelles nécessitant un placement adapté', true, 4),
    (est_id, 'AUDITION', 'Problèmes d''audition avérés', 'Difficultés auditives nécessitant un placement adapté', true, 5),
    (est_id, 'MOTEUR', 'Troubles moteurs avérés', 'Difficultés motrices nécessitant des adaptations', true, 6),
    (est_id, 'DYS', 'Trouble DYS diagnostiqué', 'Dyslexie, Dyspraxie, Dyscalculie, Dysorthographie...', true, 7),
    (est_id, 'ANXIETE', 'Attaques de panique / Anxiété scolaire', 'Troubles anxieux nécessitant une attention particulière', true, 8),
    (est_id, 'TSA', 'TSA', 'Trouble du Spectre de l''Autisme', true, 9),
    (est_id, 'HPI', 'HPI', 'Haut Potentiel Intellectuel', true, 10),
    (est_id, 'PTSD', 'PTSD diagnostiqué', 'Stress Post-Traumatique diagnostiqué', true, 11),
    (est_id, 'ALLOPHONE', 'Élève allophone', 'Élève dont le français n''est pas la langue maternelle', true, 12),
    (est_id, 'ULIS', 'Enseignement aménagé ULIS', 'Unité Localisée pour l''Inclusion Scolaire', true, 13),
    (est_id, 'SEGPA', 'Enseignement aménagé SEGPA', 'Section d''Enseignement Général et Professionnel Adapté', true, 14)
  ON CONFLICT (establishment_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6. Exécuter pour tous les établissements existants
DO $$
DECLARE
  est RECORD;
BEGIN
  FOR est IN SELECT id FROM public.establishments LOOP
    PERFORM insert_default_special_needs(est.id);
  END LOOP;
END $$;

-- 7. Créer un trigger pour ajouter les besoins par défaut aux nouveaux établissements
CREATE OR REPLACE FUNCTION trigger_insert_default_special_needs()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_default_special_needs(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_establishment_created_add_special_needs ON public.establishments;
CREATE TRIGGER on_establishment_created_add_special_needs
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_insert_default_special_needs();

-- 8. Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_students_special_needs ON public.students USING GIN (special_needs);
CREATE INDEX IF NOT EXISTS idx_students_gender ON public.students (gender);
CREATE INDEX IF NOT EXISTS idx_establishment_special_needs_establishment ON public.establishment_special_needs (establishment_id);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
