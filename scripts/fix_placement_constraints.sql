-- ============================================
-- Script de FIX : Ajouter le type 'aesh' au CHECK constraint
-- À exécuter si la table placement_constraints existe déjà
-- ============================================

-- Supprimer l'ancien CHECK constraint
ALTER TABLE public.placement_constraints DROP CONSTRAINT IF EXISTS placement_constraints_constraint_type_check;

-- Recréer avec 'aesh' inclus
ALTER TABLE public.placement_constraints ADD CONSTRAINT placement_constraints_constraint_type_check 
  CHECK (constraint_type IN ('ensemble', 'separes', 'devant', 'aesh'));

-- Supprimer et recréer la politique RLS
DROP POLICY IF EXISTS "Teachers manage own constraints" ON public.placement_constraints;
CREATE POLICY "Teachers manage own constraints" ON public.placement_constraints
  FOR ALL USING (true) WITH CHECK (true);
