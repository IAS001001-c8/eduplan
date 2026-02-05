-- Script SQL pour ajouter le champ LV2 à la table students et le filtre sur sous-salles
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne lv2 à la table students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS lv2 TEXT DEFAULT NULL;

-- Créer un index pour optimiser les recherches par lv2
CREATE INDEX IF NOT EXISTS idx_students_lv2 ON public.students(lv2);

-- Commentaire pour documentation
COMMENT ON COLUMN public.students.lv2 IS 'Langue Vivante 2 de l élève (espagnol, allemand, italien, etc.)';

-- 2. Ajouter la colonne filtered_student_ids à la table sub_rooms pour stocker les élèves filtrés par LV2
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS filtered_student_ids UUID[] DEFAULT NULL;

ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS lv2_filter TEXT DEFAULT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.sub_rooms.filtered_student_ids IS 'Liste des IDs d élèves spécifiques pour cette sous-salle (utilisé pour le filtrage par LV2)';
COMMENT ON COLUMN public.sub_rooms.lv2_filter IS 'Valeur LV2 utilisée pour filtrer les élèves de cette sous-salle';

-- Valeurs possibles pour LV2 (texte libre mais valeurs courantes):
-- Espagnol, Allemand, Italien, Portugais, Chinois, Arabe, null (non renseigné)
