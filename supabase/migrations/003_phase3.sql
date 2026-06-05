-- ============================================================
-- Fase 3: Push Notifications + Tarifas dinámicas
-- ============================================================

-- Agregar columna fcm_token a users
alter table public.users
  add column if not exists fcm_token text;

-- ============================================================
-- TABLA: tariffs (tarifas dinámicas)
-- ============================================================
create table if not exists public.tariffs (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'default',
  base_fare numeric(8,2) not null default 2.00,
  per_km numeric(8,2) not null default 1.50,
  per_min numeric(8,2) not null default 0.20,
  surge_multiplier numeric(4,2) not null default 1.00,
  surge_active boolean not null default false,
  min_fare numeric(8,2) not null default 2.00,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

alter table public.tariffs enable row level security;

-- Todos los autenticados pueden leer tarifas
create policy "Anyone can read tariffs"
  on public.tariffs for select
  using (auth.uid() is not null);

-- Solo admin puede modificar
create policy "Admins can manage tariffs"
  on public.tariffs for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- Insertar tarifa por defecto
insert into public.tariffs (name, base_fare, per_km, per_min, surge_multiplier, surge_active, min_fare)
values ('default', 2.00, 1.50, 0.20, 1.00, false, 2.00)
on conflict do nothing;

-- Trigger updated_at
create trigger tariffs_updated_at
  before update on public.tariffs
  for each row execute function update_updated_at_column();

-- ============================================================
-- TRIGGER: Webhook a Edge Function cuando cambia el status del viaje
-- ============================================================
-- Nota: Configurar el webhook en Supabase Dashboard:
-- Database > Webhooks > New Webhook
-- Table: trips, Events: UPDATE, URL: {SUPABASE_URL}/functions/v1/notify-trip-status
-- O usar pg_net para llamada directa:

-- Requiere pg_net extension habilitada en Supabase
-- create extension if not exists pg_net;

-- create or replace function public.notify_trip_status_change()
-- returns trigger as $$
-- begin
--   if new.status is distinct from old.status then
--     perform net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/notify-trip-status',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--       ),
--       body := row_to_json(new)::jsonb
--     );
--   end if;
--   return new;
-- end;
-- $$ language plpgsql security definer;

-- create trigger on_trip_status_change
--   after update on public.trips
--   for each row execute function public.notify_trip_status_change();

-- Habilitar realtime para tariffs
alter publication supabase_realtime add table public.tariffs;
