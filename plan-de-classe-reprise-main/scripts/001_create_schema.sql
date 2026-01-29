-- Create establishments table
create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz default now()
);

-- Updated establishment codes to stm001 and vh001
-- Insert predefined establishments
insert into public.establishments (name, code) values
  ('ST-MARIE 14000', 'stm001'),
  ('VICTOR-HUGO 18760', 'vh001')
on conflict (name) do nothing;

-- Create user roles enum
create type user_role as enum ('vie-scolaire', 'professeur', 'delegue', 'eco-delegue');

-- Added username field for login
-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  establishment_id uuid references public.establishments(id) on delete cascade,
  role user_role not null,
  username text unique not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  can_create_subrooms boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create teachers table
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  establishment_id uuid references public.establishments(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  subject text,
  classes text[], -- Array of class names they teach
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create students table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  class_name text not null,
  role user_role default 'delegue',
  can_create_subrooms boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;

-- RLS Policies for establishments (public read)
create policy "establishments_select_all"
  on public.establishments for select
  using (true);

-- RLS Policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for teachers (vie-scolaire can manage, teachers can view own)
create policy "teachers_select_own_establishment"
  on public.teachers for select
  using (
    establishment_id in (
      select establishment_id from public.profiles where id = auth.uid()
    )
  );

create policy "teachers_insert_vie_scolaire"
  on public.teachers for insert
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = teachers.establishment_id
    )
  );

create policy "teachers_update_vie_scolaire"
  on public.teachers for update
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = teachers.establishment_id
    )
  );

create policy "teachers_delete_vie_scolaire"
  on public.teachers for delete
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = teachers.establishment_id
    )
  );

-- RLS Policies for students (vie-scolaire can manage, students can view own)
create policy "students_select_own_establishment"
  on public.students for select
  using (
    establishment_id in (
      select establishment_id from public.profiles where id = auth.uid()
    )
  );

create policy "students_insert_vie_scolaire"
  on public.students for insert
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = students.establishment_id
    )
  );

create policy "students_update_vie_scolaire"
  on public.students for update
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = students.establishment_id
    )
  );

create policy "students_delete_vie_scolaire"
  on public.students for delete
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = students.establishment_id
    )
  );
