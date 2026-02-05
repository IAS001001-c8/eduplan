-- Script SQL pour ajouter le champ LV2 à la table students
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter la colonne lv2 à la table students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS lv2 TEXT DEFAULT NULL;

-- Créer un index pour optimiser les recherches par lv2
CREATE INDEX IF NOT EXISTS idx_students_lv2 ON public.students(lv2);

-- Commentaire pour documentation
COMMENT ON COLUMN public.students.lv2 IS 'Langue Vivante 2 de l élève (espagnol, allemand, italien, etc.)';

-- Valeurs possibles pour LV2 (texte libre mais valeurs courantes):
-- Espagnol, Allemand, Italien, Portugais, Chinois, Arabe, null (non renseigné)
