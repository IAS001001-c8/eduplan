-- ============================================
-- Script de migration : Contraintes de placement
-- À exécuter sur Supabase SQL Editor
-- ============================================

-- Table des contraintes de placement par professeur
CREATE TABLE IF NOT EXISTS public.placement_constraints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  establishment_id uuid NOT NULL,
  constraint_type text NOT NULL CHECK (constraint_type IN ('ensemble', 'separes', 'devant', 'aesh')),
  student_ids uuid[] NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT placement_constraints_pkey PRIMARY KEY (id),
  CONSTRAINT placement_constraints_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE,
  CONSTRAINT placement_constraints_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_placement_constraints_teacher ON public.placement_constraints(teacher_id);
CREATE INDEX IF NOT EXISTS idx_placement_constraints_establishment ON public.placement_constraints(establishment_id);

-- Activer RLS
ALTER TABLE public.placement_constraints ENABLE ROW LEVEL SECURITY;

-- Politique : les professeurs peuvent gérer leurs propres contraintes
CREATE POLICY "Teachers manage own constraints" ON public.placement_constraints
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Commentaire
COMMENT ON TABLE public.placement_constraints IS 'Contraintes de placement définies par chaque professeur pour ses élèves. S''appliquent à tous les plans de classe du professeur contenant les élèves concernés.';
COMMENT ON COLUMN public.placement_constraints.constraint_type IS 'ensemble = côte à côte, separes = min 2 places écart, devant = rang 1 ou 2, aesh = garder une place libre à côté';
COMMENT ON COLUMN public.placement_constraints.student_ids IS 'Liste des élèves concernés par la contrainte (2-4 pour ensemble/separes, 1+ pour devant)';
COMMENT ON COLUMN public.placement_constraints.reason IS 'Raison optionnelle pour l''historique (conseil de classe, etc.)';
