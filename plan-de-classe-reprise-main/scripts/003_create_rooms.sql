-- Create rooms table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  name text not null,
  code text not null,
  config jsonb not null, -- Store column configuration
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(establishment_id, code)
);

-- Create room_assignments table (for teacher-specific versions of shared rooms)
create table if not exists public.room_assignments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  class_name text not null,
  seat_assignments jsonb default '{}', -- Store seat assignments
  is_modifiable_by_delegates boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(room_id, teacher_id, class_name)
);

-- Create room_shares table (for public sharing links)
create table if not exists public.room_shares (
  id uuid primary key default gen_random_uuid(),
  room_assignment_id uuid references public.room_assignments(id) on delete cascade,
  share_token text not null unique,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- Enable Row Level Security
alter table public.rooms enable row level security;
alter table public.room_assignments enable row level security;
alter table public.room_shares enable row level security;

-- RLS Policies for rooms
create policy "rooms_select_own_establishment"
  on public.rooms for select
  using (
    establishment_id in (
      select establishment_id from public.profiles where id = auth.uid()
    )
  );

create policy "rooms_insert_vie_scolaire"
  on public.rooms for insert
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = rooms.establishment_id
    )
  );

create policy "rooms_update_vie_scolaire"
  on public.rooms for update
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = rooms.establishment_id
    )
  );

create policy "rooms_delete_vie_scolaire"
  on public.rooms for delete
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'vie-scolaire'
      and establishment_id = rooms.establishment_id
    )
  );

-- RLS Policies for room_assignments
create policy "room_assignments_select_own"
  on public.room_assignments for select
  using (
    exists (
      select 1 from public.rooms r
      join public.profiles p on p.establishment_id = r.establishment_id
      where r.id = room_assignments.room_id
      and p.id = auth.uid()
    )
  );

create policy "room_assignments_insert_authorized"
  on public.room_assignments for insert
  with check (
    exists (
      select 1 from public.profiles p
      join public.rooms r on r.establishment_id = p.establishment_id
      where r.id = room_assignments.room_id
      and p.id = auth.uid()
      and (p.role = 'vie-scolaire' or p.role = 'professeur')
    )
  );

create policy "room_assignments_update_own"
  on public.room_assignments for update
  using (
    exists (
      select 1 from public.profiles p
      join public.teachers t on t.profile_id = p.id
      where t.id = room_assignments.teacher_id
      and p.id = auth.uid()
    )
    or
    exists (
      select 1 from public.profiles p
      join public.rooms r on r.establishment_id = p.establishment_id
      where r.id = room_assignments.room_id
      and p.id = auth.uid()
      and p.role = 'vie-scolaire'
    )
  );

create policy "room_assignments_delete_authorized"
  on public.room_assignments for delete
  using (
    exists (
      select 1 from public.profiles p
      join public.rooms r on r.establishment_id = p.establishment_id
      where r.id = room_assignments.room_id
      and p.id = auth.uid()
      and p.role = 'vie-scolaire'
    )
  );

-- RLS Policies for room_shares (public read with token)
create policy "room_shares_select_all"
  on public.room_shares for select
  using (true);

create policy "room_shares_insert_authorized"
  on public.room_shares for insert
  with check (
    exists (
      select 1 from public.room_assignments ra
      join public.rooms r on r.id = ra.room_id
      join public.profiles p on p.establishment_id = r.establishment_id
      where ra.id = room_shares.room_assignment_id
      and p.id = auth.uid()
      and (p.role = 'vie-scolaire' or p.role = 'professeur')
    )
  );

-- Create indexes for performance
create index idx_rooms_establishment on public.rooms(establishment_id);
create index idx_room_assignments_room on public.room_assignments(room_id);
create index idx_room_assignments_teacher on public.room_assignments(teacher_id);
create index idx_room_shares_token on public.room_shares(share_token);
