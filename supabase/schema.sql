-- ============================================================
-- MotoTaxi PWA - Schema SQL para Supabase
-- ============================================================

-- Habilitar extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "postgis"; -- Opcional: para geolocalización avanzada

-- ============================================================
-- TABLA: users
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  role text not null default 'CLIENT' check (role in ('CLIENT', 'DRIVER', 'ADMIN')),
  photo text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Policies: users
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "Admins can update all users"
  on public.users for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- TABLA: driver_profiles
-- ============================================================
create table public.driver_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  motorcycle_model text not null,
  license_plate text not null unique,
  license_number text not null unique,
  is_approved boolean not null default false,
  is_online boolean not null default false,
  current_lat numeric(10, 7),
  current_lng numeric(10, 7),
  updated_at timestamptz not null default now()
);

alter table public.driver_profiles enable row level security;

-- Policies: driver_profiles
create policy "Drivers can view and update their own profile"
  on public.driver_profiles for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.id = user_id
    )
  );

create policy "Clients can view online drivers"
  on public.driver_profiles for select
  using (is_online = true and is_approved = true);

create policy "Admins can manage all driver profiles"
  on public.driver_profiles for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- TABLA: trips
-- ============================================================
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.users(id),
  driver_id uuid references public.users(id),
  origin_lat numeric(10, 7) not null,
  origin_lng numeric(10, 7) not null,
  destination_lat numeric(10, 7) not null,
  destination_lng numeric(10, 7) not null,
  origin_address text,
  destination_address text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ASSIGNED', 'ON_ROUTE', 'STARTED', 'FINISHED', 'CANCELLED')),
  price numeric(8, 2),
  distance_km numeric(8, 3),
  duration_min integer,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

-- Policies: trips
create policy "Clients can create trips"
  on public.trips for insert
  with check (auth.uid() = client_id);

create policy "Clients can view their own trips"
  on public.trips for select
  using (auth.uid() = client_id);

create policy "Clients can cancel their own pending trips"
  on public.trips for update
  using (auth.uid() = client_id and status = 'PENDING');

create policy "Drivers can view pending trips"
  on public.trips for select
  using (
    status = 'PENDING' and
    exists (
      select 1 from public.driver_profiles dp
      where dp.user_id = auth.uid() and dp.is_approved = true and dp.is_online = true
    )
  );

create policy "Drivers can view and update their assigned trips"
  on public.trips for all
  using (auth.uid() = driver_id);

create policy "Drivers can accept pending trips"
  on public.trips for update
  using (
    status = 'PENDING' and
    exists (
      select 1 from public.driver_profiles dp
      where dp.user_id = auth.uid() and dp.is_approved = true and dp.is_online = true
    )
  );

create policy "Admins can manage all trips"
  on public.trips for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- TRIGGER: updated_at auto-update
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at
  before update on public.trips
  for each row execute function update_updated_at_column();

create trigger driver_profiles_updated_at
  before update on public.driver_profiles
  for each row execute function update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create user profile on sign up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'CLIENT')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- REALTIME: Habilitar realtime en tablas clave
-- ============================================================
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.driver_profiles;
