-- Create sub-room types enum
create type subroom_type as enum ('temporary', 'indeterminate');

-- Create sub-rooms table
create table if not exists public.sub_rooms (
  id uuid primary key default gen_random_uuid(),
  room_assignment_id uuid references public.room_assignments(id) on delete cascade,
  name text not null,
  type subroom_type not null,
  start_date timestamptz,
  end_date timestamptz,
  seat_assignments jsonb default '{}',
  is_modifiable_by_delegates boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Constraint: temporary sub-rooms must have start and end dates
  constraint check_temporary_dates check (
    (type = 'temporary' and start_date is not null and end_date is not null and end_date > start_date)
    or type = 'indeterminate'
  ),
  -- Constraint: minimum 2 days for temporary sub-rooms
  constraint check_minimum_duration check (
    type = 'indeterminate' or (end_date - start_date >= interval '2 days')
  )
);

-- Create function to auto-delete expired temporary sub-rooms
create or replace function delete_expired_subrooms()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.sub_rooms
  where type = 'temporary'
  and end_date < now();
end;
$$;

-- Enable Row Level Security
alter table public.sub_rooms enable row level security;

-- RLS Policies for sub_rooms
create policy "sub_rooms_select_own"
  on public.sub_rooms for select
  using (
    exists (
      select 1 from public.room_assignments ra
      join public.rooms r on r.id = ra.room_id
      join public.profiles p on p.establishment_id = r.establishment_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
    )
  );

create policy "sub_rooms_insert_authorized"
  on public.sub_rooms for insert
  with check (
    exists (
      select 1 from public.room_assignments ra
      join public.rooms r on r.id = ra.room_id
      join public.profiles p on p.establishment_id = r.establishment_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
      and (p.role = 'vie-scolaire' or p.role = 'professeur')
    )
    or
    exists (
      select 1 from public.room_assignments ra
      join public.teachers t on t.id = ra.teacher_id
      join public.profiles p on p.id = t.profile_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
    )
  );

create policy "sub_rooms_update_own"
  on public.sub_rooms for update
  using (
    exists (
      select 1 from public.room_assignments ra
      join public.teachers t on t.id = ra.teacher_id
      join public.profiles p on p.id = t.profile_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
    )
    or
    exists (
      select 1 from public.room_assignments ra
      join public.rooms r on r.id = ra.room_id
      join public.profiles p on p.establishment_id = r.establishment_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
      and p.role = 'vie-scolaire'
    )
  );

create policy "sub_rooms_delete_own"
  on public.sub_rooms for delete
  using (
    exists (
      select 1 from public.room_assignments ra
      join public.teachers t on t.id = ra.teacher_id
      join public.profiles p on p.id = t.profile_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
    )
    or
    exists (
      select 1 from public.room_assignments ra
      join public.rooms r on r.id = ra.room_id
      join public.profiles p on p.establishment_id = r.establishment_id
      where ra.id = sub_rooms.room_assignment_id
      and p.id = auth.uid()
      and p.role = 'vie-scolaire'
    )
  );

-- Create index for performance
create index idx_sub_rooms_assignment on public.sub_rooms(room_assignment_id);
create index idx_sub_rooms_end_date on public.sub_rooms(end_date) where type = 'temporary';
