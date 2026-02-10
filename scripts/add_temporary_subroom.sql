-- Script SQL pour ajouter la fonctionnalité "Sous-salle temporaire"
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne is_temporary (défaut: false)
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE;

-- 2. Ajouter la colonne temporary_date (nullable)
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS temporary_date DATE DEFAULT NULL;

-- 3. Créer un index pour optimiser les requêtes sur les sous-salles temporaires
CREATE INDEX IF NOT EXISTS idx_sub_rooms_temporary ON public.sub_rooms(is_temporary, temporary_date);

-- 4. Commentaires pour documentation
COMMENT ON COLUMN public.sub_rooms.is_temporary IS 'Indique si la sous-salle est temporaire (pour un jour uniquement)';
COMMENT ON COLUMN public.sub_rooms.temporary_date IS 'Date à laquelle la sous-salle temporaire est active';

-- 5. Fonction pour nettoyer automatiquement les sous-salles temporaires expirées (optionnel)
-- Cette fonction peut être appelée manuellement ou via un cron job
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_subrooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sub_rooms
  WHERE is_temporary = TRUE 
    AND temporary_date < CURRENT_DATE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Pour nettoyer manuellement les sous-salles expirées:
-- SELECT cleanup_expired_temporary_subrooms();
