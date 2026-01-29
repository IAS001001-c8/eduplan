-- Correction des dernières références à auth.users
-- Ce script supprime les dépendances à auth.users dans rooms et sub_rooms

-- 1. Supprimer les contraintes de clé étrangère vers auth.users
ALTER TABLE public.rooms 
DROP CONSTRAINT IF EXISTS rooms_created_by_fkey;

ALTER TABLE public.sub_rooms 
DROP CONSTRAINT IF EXISTS sub_rooms_created_by_fkey;

-- 2. Ajouter les nouvelles contraintes vers profiles
ALTER TABLE public.rooms 
ADD CONSTRAINT rooms_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sub_rooms 
ADD CONSTRAINT sub_rooms_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Mettre à jour les politiques RLS si nécessaire
DROP POLICY IF EXISTS "rooms_select_own_establishment" ON public.rooms;
CREATE POLICY "rooms_select_own_establishment" ON public.rooms
FOR SELECT USING (
  establishment_id IN (
    SELECT establishment_id FROM public.profiles WHERE id = auth.uid()
  )
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "sub_rooms_select_own" ON public.sub_rooms;
CREATE POLICY "sub_rooms_select_own" ON public.sub_rooms
FOR SELECT USING (
  created_by = auth.uid()
  OR created_by IN (
    SELECT id FROM public.profiles WHERE establishment_id IN (
      SELECT establishment_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Confirmation
SELECT 'Toutes les références à auth.users ont été supprimées !' as status;
