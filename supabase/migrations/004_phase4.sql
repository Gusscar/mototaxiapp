-- ============================================================
-- Fase 4: Pagos + Cupones + Referidos
-- ============================================================

-- Agregar columnas a users
alter table public.users
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.users(id),
  add column if not exists wallet_balance numeric(10,2) not null default 0.00;

-- Agregar columnas a trips
alter table public.trips
  add column if not exists payment_method text not null default 'CASH'
    check (payment_method in ('CASH', 'CARD', 'YAPE', 'WALLET')),
  add column if not exists payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
  add column if not exists final_price numeric(8,2),
  add column if not exists discount_amount numeric(8,2) default 0,
  add column if not exists coupon_id uuid;

-- ============================================================
-- TABLA: coupons
-- ============================================================
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  description text,
  discount_type text not null default 'PERCENT'
    check (discount_type in ('PERCENT', 'FIXED')),
  discount_value numeric(8,2) not null,
  min_trip_price numeric(8,2) default 0,
  max_uses integer,
  uses_count integer not null default 0,
  max_uses_per_user integer not null default 1,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "Users can read active coupons"
  on public.coupons for select
  using (is_active = true and auth.uid() is not null);

create policy "Admins can manage coupons"
  on public.coupons for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- TABLA: coupon_usages
-- ============================================================
create table if not exists public.coupon_usages (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id),
  user_id uuid not null references public.users(id),
  trip_id uuid references public.trips(id),
  discount_applied numeric(8,2) not null,
  used_at timestamptz not null default now(),
  unique(coupon_id, user_id, trip_id)
);

alter table public.coupon_usages enable row level security;

create policy "Users can view their own coupon usages"
  on public.coupon_usages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own coupon usages"
  on public.coupon_usages for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all coupon usages"
  on public.coupon_usages for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- TABLA: payments
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references public.users(id),
  amount numeric(8,2) not null,
  method text not null check (method in ('CASH', 'CARD', 'YAPE', 'WALLET')),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  external_id text,       -- ID de la pasarela de pago (Culqi, etc.)
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can create their own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage all payments"
  on public.payments for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- TABLA: referrals
-- ============================================================
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.users(id),
  referred_id uuid not null references public.users(id),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'COMPLETED', 'REWARDED')),
  reward_amount numeric(8,2) default 5.00,
  created_at timestamptz not null default now(),
  unique(referred_id)
);

alter table public.referrals enable row level security;

create policy "Users can view their own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "Admins can manage referrals"
  on public.referrals for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- ============================================================
-- FUNCIÓN: Generar código de referido único al crear usuario
-- ============================================================
create or replace function public.generate_referral_code()
returns trigger as $$
begin
  new.referral_code := upper(substring(replace(new.id::text, '-', ''), 1, 8));
  return new;
end;
$$ language plpgsql;

create trigger set_referral_code
  before insert on public.users
  for each row
  when (new.referral_code is null)
  execute function public.generate_referral_code();

-- Actualizar usuarios existentes
update public.users
set referral_code = upper(substring(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

-- ============================================================
-- FK: trips.coupon_id → coupons
-- ============================================================
alter table public.trips
  add constraint trips_coupon_id_fkey
  foreign key (coupon_id) references public.coupons(id)
  on delete set null
  not valid;

-- ============================================================
-- FUNCIÓN: increment_coupon_uses
-- ============================================================
create or replace function public.increment_coupon_uses(coupon_id uuid)
returns void as $$
begin
  update public.coupons
  set uses_count = uses_count + 1
  where id = coupon_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN: add_wallet_balance
-- ============================================================
create or replace function public.add_wallet_balance(user_id uuid, amount numeric)
returns void as $$
begin
  update public.users
  set wallet_balance = wallet_balance + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Realtime
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.coupons;
