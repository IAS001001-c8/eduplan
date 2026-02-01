-- =====================================================
-- CORRECTION RLS - À exécuter dans Supabase SQL Editor
-- L'authentification custom ne fonctionne pas avec auth.uid()
-- =====================================================

-- Désactiver RLS sur les nouvelles tables
ALTER TABLE public.establishment_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_ab_calendar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_room_schedules DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their establishment settings" ON public.establishment_settings;
DROP POLICY IF EXISTS "Vie scolaire can manage establishment settings" ON public.establishment_settings;
DROP POLICY IF EXISTS "Users can view their establishment week calendar" ON public.week_ab_calendar;
DROP POLICY IF EXISTS "Vie scolaire can manage week calendar" ON public.week_ab_calendar;
DROP POLICY IF EXISTS "Users can view sub room schedules" ON public.sub_room_schedules;
DROP POLICY IF EXISTS "Teachers and vie scolaire can manage sub room schedules" ON public.sub_room_schedules;

-- Créer des politiques permissives (gestion des permissions côté application)
CREATE POLICY "Allow all access to establishment_settings"
  ON public.establishment_settings FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to week_ab_calendar"
  ON public.week_ab_calendar FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to sub_room_schedules"
  ON public.sub_room_schedules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Réactiver RLS avec les nouvelles politiques permissives
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_ab_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_room_schedules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
