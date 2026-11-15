-- LilTuning — schema inicial
-- Correr completo en Supabase Studio -> SQL Editor (una sola vez).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────
-- SERVICIOS
-- ─────────────────────────────────────────────────────────
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  duration_minutes int not null default 60 check (duration_minutes > 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- USUARIOS DEL PANEL (staff / super_admin)
-- id = auth.users.id (se crea primero el usuario de Auth, luego esta fila)
-- ─────────────────────────────────────────────────────────
create table if not exists staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('staff', 'super_admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- DISPONIBILIDAD
-- ─────────────────────────────────────────────────────────
create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int not null default 60 check (slot_duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint availability_rules_time_order check (end_time > start_time)
);

create table if not exists closed_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- RESERVAS
-- ─────────────────────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id),
  booking_date date not null,
  booking_time time not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'completed', 'no_show', 'cancelled', 'expired')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  vehicle_make text,
  vehicle_model text,
  vehicle_plate text,
  deposit_amount_clp int not null,
  mp_preference_id text,
  mp_payment_id text,
  assigned_staff_id uuid references staff_users (id),
  staff_notes text,
  expires_at timestamptz, -- solo mientras status = pending_payment
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita doble reserva del mismo bloque horario: solo un booking
-- "activo" (pendiente de pago o confirmado) puede ocupar un slot.
create unique index if not exists ux_bookings_active_slot
  on bookings (booking_date, booking_time)
  where status in ('pending_payment', 'confirmed');

create index if not exists ix_bookings_date on bookings (booking_date);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bookings_updated_at on bookings;
create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- Libera los cupos "pendiente de pago" que quedaron abandonados
-- (el checkout de Mercado Pago se abrió pero nunca se pagó).
create or replace function expire_stale_bookings()
returns void as $$
begin
  update bookings
    set status = 'expired'
    where status = 'pending_payment'
      and expires_at is not null
      and expires_at < now();
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────
-- AUDITORÍA / IDEMPOTENCIA DE WEBHOOKS DE MERCADO PAGO
-- ─────────────────────────────────────────────────────────
create table if not exists payment_events (
  id bigint generated always as identity primary key,
  mp_payment_id text not null,
  booking_id uuid references bookings (id),
  status text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (mp_payment_id, status)
);

-- ─────────────────────────────────────────────────────────
-- CONFIGURACIÓN GENERAL DEL SITIO (clave/valor)
-- ─────────────────────────────────────────────────────────
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────
alter table services enable row level security;
alter table staff_users enable row level security;
alter table availability_rules enable row level security;
alter table closed_dates enable row level security;
alter table bookings enable row level security;
alter table payment_events enable row level security;
alter table site_settings enable row level security;

-- Helper implícito reutilizado en las policies: "el usuario autenticado
-- es un miembro activo del staff" / "...es super_admin".
-- (Postgres no tiene funciones inline reusables entre policies sin crear
-- una función; se define una para mantenerlas legibles.)
create or replace function is_active_staff()
returns boolean as $$
  select exists (
    select 1 from staff_users su
    where su.id = auth.uid() and su.active
  );
$$ language sql stable security definer set search_path = public;

create or replace function is_super_admin()
returns boolean as $$
  select exists (
    select 1 from staff_users su
    where su.id = auth.uid() and su.active and su.role = 'super_admin'
  );
$$ language sql stable security definer set search_path = public;

-- services: el staff ve y administra el catálogo; solo super_admin escribe.
drop policy if exists services_select on services;
create policy services_select on services for select using (is_active_staff());
drop policy if exists services_write on services;
create policy services_write on services for all
  using (is_super_admin()) with check (is_super_admin());

-- staff_users: cada quien ve su propia fila; super_admin ve y administra todo.
drop policy if exists staff_users_select_self on staff_users;
create policy staff_users_select_self on staff_users for select
  using (id = auth.uid() or is_super_admin());
drop policy if exists staff_users_write on staff_users;
create policy staff_users_write on staff_users for all
  using (is_super_admin()) with check (is_super_admin());

-- disponibilidad: cualquier staff activo puede gestionarla (spec 4.1).
drop policy if exists availability_rules_all on availability_rules;
create policy availability_rules_all on availability_rules for all
  using (is_active_staff()) with check (is_active_staff());
drop policy if exists closed_dates_all on closed_dates;
create policy closed_dates_all on closed_dates for all
  using (is_active_staff()) with check (is_active_staff());

-- bookings: el staff ve/edita todas las reservas (atención + super admin).
drop policy if exists bookings_select on bookings;
create policy bookings_select on bookings for select using (is_active_staff());
drop policy if exists bookings_update on bookings;
create policy bookings_update on bookings for update
  using (is_active_staff()) with check (is_active_staff());
drop policy if exists bookings_insert_staff on bookings;
create policy bookings_insert_staff on bookings for insert
  with check (is_active_staff());
drop policy if exists bookings_delete on bookings;
create policy bookings_delete on bookings for delete using (is_super_admin());
-- (El INSERT público de clientes NO tiene policy: pasa siempre por el
-- endpoint del servidor con la service_role key, que ignora RLS.)

-- payment_events: sin policies -> inaccesible salvo service_role.

-- site_settings: staff lee (para mostrar datos en el panel), solo
-- super_admin edita la configuración general.
drop policy if exists site_settings_select on site_settings;
create policy site_settings_select on site_settings for select using (is_active_staff());
drop policy if exists site_settings_write on site_settings;
create policy site_settings_write on site_settings for all
  using (is_super_admin()) with check (is_super_admin());
