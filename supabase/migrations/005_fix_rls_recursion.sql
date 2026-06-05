-- ============================================================
-- Fix: infinite recursion in users RLS policies
-- ============================================================

-- Función que verifica si el usuario actual es ADMIN
-- security definer = se ejecuta con permisos del creador, omitiendo RLS
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'ADMIN'
  );
$$ language sql security definer stable;

-- Eliminar políticas recursivas
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Admins can update all users" on public.users;
drop policy if exists "Admins can manage all driver profiles" on public.driver_profiles;
drop policy if exists "Admins can manage all trips" on public.trips;
drop policy if exists "Admins can manage coupons" on public.coupons;
drop policy if exists "Admins can view all coupon usages" on public.coupon_usages;
drop policy if exists "Admins can manage all payments" on public.payments;
drop policy if exists "Admins can manage referrals" on public.referrals;

-- Recrear con la función is_admin() (sin recursión)
create policy "Admins can view all users"
  on public.users for select
  using (public.is_admin());

create policy "Admins can update all users"
  on public.users for update
  using (public.is_admin());

create policy "Admins can manage all driver profiles"
  on public.driver_profiles for all
  using (public.is_admin());

create policy "Admins can manage all trips"
  on public.trips for all
  using (public.is_admin());

create policy "Admins can manage coupons"
  on public.coupons for all
  using (public.is_admin());

create policy "Admins can view all coupon usages"
  on public.coupon_usages for select
  using (public.is_admin());

create policy "Admins can manage all payments"
  on public.payments for all
  using (public.is_admin());

create policy "Admins can manage referrals"
  on public.referrals for all
  using (public.is_admin());
