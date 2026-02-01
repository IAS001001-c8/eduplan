-- =====================================================
-- EduPlan - Créneaux Horaires & Semaines A/B
-- Script à exécuter dans Supabase SQL Editor
-- =====================================================

-- 1. Table des paramètres de l'établissement
CREATE TABLE IF NOT EXISTS public.establishment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL UNIQUE,
  timezone text DEFAULT 'Europe/Paris',
  school_year_start_month integer DEFAULT 8, -- Août
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT establishment_settings_pkey PRIMARY KEY (id),
  CONSTRAINT establishment_settings_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE
);

-- 2. Table du calendrier des semaines A/B
CREATE TABLE IF NOT EXISTS public.week_ab_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  year integer NOT NULL,
  week_type character varying(1) NOT NULL CHECK (week_type IN ('A', 'B')),
  week_start_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT week_ab_calendar_pkey PRIMARY KEY (id),
  CONSTRAINT week_ab_calendar_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE,
  CONSTRAINT week_ab_calendar_unique UNIQUE (establishment_id, week_number, year)
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_week_ab_calendar_establishment ON public.week_ab_calendar(establishment_id);
CREATE INDEX IF NOT EXISTS idx_week_ab_calendar_week ON public.week_ab_calendar(establishment_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_week_ab_calendar_date ON public.week_ab_calendar(establishment_id, week_start_date);

-- 3. Table des créneaux horaires des sous-salles
CREATE TABLE IF NOT EXISTS public.sub_room_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sub_room_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Lundi, 6 = Dimanche
  start_time time NOT NULL,
  end_time time NOT NULL,
  week_type character varying(4) NOT NULL DEFAULT 'both' CHECK (week_type IN ('A', 'B', 'both')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_room_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT sub_room_schedules_sub_room_id_fkey FOREIGN KEY (sub_room_id) REFERENCES public.sub_rooms(id) ON DELETE CASCADE,
  CONSTRAINT sub_room_schedules_time_check CHECK (start_time < end_time)
);

-- Index pour optimiser les recherches de créneaux
CREATE INDEX IF NOT EXISTS idx_sub_room_schedules_sub_room ON public.sub_room_schedules(sub_room_id);
CREATE INDEX IF NOT EXISTS idx_sub_room_schedules_day ON public.sub_room_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_sub_room_schedules_week_type ON public.sub_room_schedules(week_type);

-- 4. Ajouter colonne timezone à sub_rooms (optionnel, hérite de l'établissement si null)
ALTER TABLE public.sub_rooms 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT NULL;

-- 5. Fonction pour obtenir le type de semaine actuel
CREATE OR REPLACE FUNCTION get_current_week_type(p_establishment_id uuid)
RETURNS character varying AS $$
DECLARE
  v_week_type character varying(1);
  v_current_date date;
  v_week_number integer;
  v_year integer;
BEGIN
  v_current_date := CURRENT_DATE;
  v_week_number := EXTRACT(WEEK FROM v_current_date);
  v_year := EXTRACT(YEAR FROM v_current_date);
  
  SELECT week_type INTO v_week_type
  FROM public.week_ab_calendar
  WHERE establishment_id = p_establishment_id
    AND year = v_year
    AND week_number = v_week_number;
  
  RETURN COALESCE(v_week_type, 'A'); -- Par défaut semaine A si non configuré
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour obtenir les sous-salles actives pour un professeur à un moment donné
CREATE OR REPLACE FUNCTION get_active_sub_rooms_for_teacher(
  p_teacher_id uuid,
  p_current_time time DEFAULT CURRENT_TIME,
  p_current_day integer DEFAULT EXTRACT(DOW FROM CURRENT_DATE)::integer - 1 -- Convertir de 0=Dimanche à 0=Lundi
)
RETURNS TABLE (
  sub_room_id uuid,
  sub_room_name text,
  room_name text,
  class_name text,
  start_time time,
  end_time time,
  week_type character varying
) AS $$
DECLARE
  v_establishment_id uuid;
  v_current_week_type character varying(1);
  v_adjusted_day integer;
BEGIN
  -- Ajuster le jour (PostgreSQL: 0=Dimanche, on veut 0=Lundi)
  v_adjusted_day := CASE 
    WHEN p_current_day = -1 THEN 6  -- Dimanche
    ELSE p_current_day
  END;
  
  -- Obtenir l'establishment_id du professeur
  SELECT t.establishment_id INTO v_establishment_id
  FROM public.teachers t
  WHERE t.id = p_teacher_id;
  
  -- Obtenir le type de semaine actuel
  v_current_week_type := get_current_week_type(v_establishment_id);
  
  RETURN QUERY
  SELECT 
    sr.id as sub_room_id,
    sr.name as sub_room_name,
    r.name as room_name,
    c.name as class_name,
    srs.start_time,
    srs.end_time,
    srs.week_type
  FROM public.sub_rooms sr
  INNER JOIN public.sub_room_schedules srs ON srs.sub_room_id = sr.id
  INNER JOIN public.rooms r ON r.id = sr.room_id
  LEFT JOIN public.classes c ON c.id = sr.class_id
  WHERE sr.teacher_id = p_teacher_id
    AND sr.is_deleted = false
    AND srs.day_of_week = v_adjusted_day
    AND p_current_time BETWEEN srs.start_time AND srs.end_time
    AND (srs.week_type = 'both' OR srs.week_type = v_current_week_type);
END;
$$ LANGUAGE plpgsql;

-- 7. Enable RLS sur les nouvelles tables
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_ab_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_room_schedules ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS pour establishment_settings
CREATE POLICY "Users can view their establishment settings"
  ON public.establishment_settings FOR SELECT
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vie scolaire can manage establishment settings"
  ON public.establishment_settings FOR ALL
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'vie-scolaire'
    )
  );

-- 9. Politiques RLS pour week_ab_calendar
CREATE POLICY "Users can view their establishment week calendar"
  ON public.week_ab_calendar FOR SELECT
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vie scolaire can manage week calendar"
  ON public.week_ab_calendar FOR ALL
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'vie-scolaire'
    )
  );

-- 10. Politiques RLS pour sub_room_schedules
CREATE POLICY "Users can view sub room schedules"
  ON public.sub_room_schedules FOR SELECT
  USING (
    sub_room_id IN (
      SELECT id FROM public.sub_rooms 
      WHERE establishment_id IN (
        SELECT establishment_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers and vie scolaire can manage sub room schedules"
  ON public.sub_room_schedules FOR ALL
  USING (
    sub_room_id IN (
      SELECT sr.id FROM public.sub_rooms sr
      INNER JOIN public.profiles p ON p.establishment_id = sr.establishment_id
      WHERE p.id = auth.uid() 
        AND (p.role = 'vie-scolaire' OR sr.teacher_id = (
          SELECT id FROM public.teachers WHERE profile_id = auth.uid()
        ))
    )
  );

-- 11. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_establishment_settings_updated_at
  BEFORE UPDATE ON public.establishment_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_week_ab_calendar_updated_at
  BEFORE UPDATE ON public.week_ab_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_room_schedules_updated_at
  BEFORE UPDATE ON public.sub_room_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Fonction pour auto-compléter le calendrier A/B
CREATE OR REPLACE FUNCTION auto_complete_week_ab_calendar(
  p_establishment_id uuid,
  p_start_week_number integer,
  p_start_year integer,
  p_start_week_type character varying(1)
)
RETURNS void AS $$
DECLARE
  v_current_week integer;
  v_current_year integer;
  v_current_type character varying(1);
  v_week_start date;
  v_end_year integer;
  v_end_week integer;
BEGIN
  v_current_week := p_start_week_number;
  v_current_year := p_start_year;
  v_current_type := p_start_week_type;
  
  -- Année scolaire: Août N à Juillet N+1 (on fait 53 semaines max)
  v_end_year := p_start_year + 1;
  v_end_week := 31; -- Fin juillet environ
  
  -- Parcourir toutes les semaines
  FOR i IN 1..53 LOOP
    -- Calculer la date de début de la semaine
    v_week_start := date_trunc('week', make_date(v_current_year, 1, 1) + ((v_current_week - 1) * 7) * interval '1 day')::date;
    
    -- Insérer ou mettre à jour
    INSERT INTO public.week_ab_calendar (establishment_id, week_number, year, week_type, week_start_date)
    VALUES (p_establishment_id, v_current_week, v_current_year, v_current_type, v_week_start)
    ON CONFLICT (establishment_id, week_number, year) 
    DO UPDATE SET week_type = v_current_type, week_start_date = v_week_start, updated_at = now();
    
    -- Passer à la semaine suivante
    v_current_week := v_current_week + 1;
    IF v_current_week > 52 THEN
      v_current_week := 1;
      v_current_year := v_current_year + 1;
    END IF;
    
    -- Alterner le type
    v_current_type := CASE WHEN v_current_type = 'A' THEN 'B' ELSE 'A' END;
    
    -- Sortir si on a atteint la fin de l'année scolaire
    IF v_current_year > v_end_year OR (v_current_year = v_end_year AND v_current_week > v_end_week) THEN
      EXIT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
