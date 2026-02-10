-- Script SQL pour ajouter le champ LV2 à la table students et le filtre sur sous-salles
-- À exécuter dans l'éditeur SQL de Supabase

-- ============================================================
-- 1. FONCTIONNALITÉ LV2 (Langue Vivante 2)
-- ============================================================

-- Ajouter la colonne lv2 à la table students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS lv2 TEXT DEFAULT NULL;

-- Créer un index pour optimiser les recherches par lv2
CREATE INDEX IF NOT EXISTS idx_students_lv2 ON public.students(lv2);

-- Commentaire pour documentation
COMMENT ON COLUMN public.students.lv2 IS 'Langue Vivante 2 de l élève (espagnol, allemand, italien, etc.)';

-- Ajouter la colonne filtered_student_ids à la table sub_rooms pour stocker les élèves filtrés par LV2
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS filtered_student_ids UUID[] DEFAULT NULL;

ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS lv2_filter TEXT DEFAULT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.sub_rooms.filtered_student_ids IS 'Liste des IDs d élèves spécifiques pour cette sous-salle (utilisé pour le filtrage par LV2)';
COMMENT ON COLUMN public.sub_rooms.lv2_filter IS 'Valeur LV2 utilisée pour filtrer les élèves de cette sous-salle';

-- ============================================================
-- 2. FONCTIONNALITÉ SOUS-SALLES TEMPORAIRES
-- ============================================================

-- Ajouter la colonne is_temporary (défaut: false)
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne temporary_date (nullable)
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS temporary_date DATE DEFAULT NULL;

-- Créer un index pour optimiser les requêtes sur les sous-salles temporaires
CREATE INDEX IF NOT EXISTS idx_sub_rooms_temporary ON public.sub_rooms(is_temporary, temporary_date);

-- Commentaires pour documentation
COMMENT ON COLUMN public.sub_rooms.is_temporary IS 'Indique si la sous-salle est temporaire (pour un jour uniquement)';
COMMENT ON COLUMN public.sub_rooms.temporary_date IS 'Date à laquelle la sous-salle temporaire est active';

-- Fonction pour nettoyer automatiquement les sous-salles temporaires expirées
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_subrooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer d'abord les créneaux associés
  DELETE FROM public.sub_room_schedules
  WHERE sub_room_id IN (
    SELECT id FROM public.sub_rooms
    WHERE is_temporary = TRUE AND temporary_date < CURRENT_DATE
  );
  
  -- Supprimer les sous-salles temporaires expirées
  DELETE FROM public.sub_rooms
  WHERE is_temporary = TRUE 
    AND temporary_date < CURRENT_DATE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Pour nettoyer manuellement les sous-salles expirées:
-- SELECT cleanup_expired_temporary_subrooms();

-- ============================================================
-- VALEURS POSSIBLES
-- ============================================================
-- LV2: Espagnol, Allemand, Italien, Portugais, Chinois, Arabe, null (non renseigné)
-- is_temporary: true = sous-salle pour un jour uniquement, false = sous-salle permanente
