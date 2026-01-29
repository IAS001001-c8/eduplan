-- Script simplifié pour créer les utilisateurs de test
-- Ce script désactive temporairement le trigger pour éviter les erreurs

-- Désactiver le trigger temporairement
alter table auth.users disable trigger on_auth_user_created;

do $$
declare
  stm_id uuid;
  vh_id uuid;
  vs_stm_user_id uuid;
  vs_vh_user_id uuid;
  prof_stm_user_id uuid;
  prof_vh_user_id uuid;
  del_stm_user_id uuid;
  del_vh_user_id uuid;
begin
  -- Récupérer les IDs des établissements
  select id into stm_id from public.establishments where code = 'stm001';
  select id into vh_id from public.establishments where code = 'vh001';

  -- Créer les utilisateurs pour ST-MARIE
  -- Vie-scolaire ST-MARIE
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'vs.stmarie@test.local',
    crypt('VieScol2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"vs.stmarie"}',
    now(),
    now(),
    '',
    ''
  ) returning id into vs_stm_user_id;

  insert into public.profiles (id, establishment_id, role, username, first_name, last_name, email, can_create_subrooms)
  values (vs_stm_user_id, stm_id, 'vie-scolaire', 'vs.stmarie', 'Vie', 'Scolaire', 'vs.stmarie@test.local', true);

  -- Professeur ST-MARIE
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'prof.stmarie@test.local',
    crypt('Prof2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"prof.stmarie"}',
    now(),
    now(),
    '',
    ''
  ) returning id into prof_stm_user_id;

  insert into public.profiles (id, establishment_id, role, username, first_name, last_name, email, can_create_subrooms)
  values (prof_stm_user_id, stm_id, 'professeur', 'prof.stmarie', 'Professeur', 'Test', 'prof.stmarie@test.local', true);

  -- Délégué ST-MARIE
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'del.stmarie@test.local',
    crypt('Delegue2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"del.stmarie"}',
    now(),
    now(),
    '',
    ''
  ) returning id into del_stm_user_id;

  insert into public.profiles (id, establishment_id, role, username, first_name, last_name, email, can_create_subrooms)
  values (del_stm_user_id, stm_id, 'delegue', 'del.stmarie', 'Délégué', 'Test', 'del.stmarie@test.local', false);

  -- Créer les utilisateurs pour VICTOR-HUGO
  -- Vie-scolaire VICTOR-HUGO
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'vs.vhugo@test.local',
    crypt('VieScol2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"vs.vhugo"}',
    now(),
    now(),
    '',
    ''
  ) returning id into vs_vh_user_id;

  insert into public.profiles (id, establishment_id, role, username, first_name, last_name, email, can_create_subrooms)
  values (vs_vh_user_id, vh_id, 'vie-scolaire', 'vs.vhugo', 'Vie', 'Scolaire', 'vs.vhugo@test.local', true);

  -- Professeur VICTOR-HUGO
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'prof.vhugo@test.local',
    crypt('Prof2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"prof.vhugo"}',
    now(),
    now(),
    '',
    ''
  ) returning id into prof_vh_user_id;

  insert into public.profiles (id, establishment_id, role, username, first_name, last_name, email, can_create_subrooms)
  values (prof_vh_user_id, vh_id, 'professeur', 'prof.vhugo', 'Professeur', 'Test', 'prof.vhugo@test.local', true);

  -- Délégué VICTOR-HUGO
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'del.vhugo@test.local',
    crypt('Delegue2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"del.vhugo"}',
    now(),
    now(),
    '',
    ''
  ) returning id into del_vh_user_id;

  insert into public.profiles (id, establishment_id, role, username, first_name, last_name, email, can_create_subrooms)
  values (del_vh_user_id, vh_id, 'delegue', 'del.vhugo', 'Délégué', 'Test', 'del.vhugo@test.local', false);

  raise notice 'Utilisateurs de test créés avec succès!';
end $$;

-- Réactiver le trigger
alter table auth.users enable trigger on_auth_user_created;
