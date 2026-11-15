-- LilTuning — módulo de ticketera (venta de entradas para eventos)
-- Correr DESPUÉS de schema.sql (usa is_active_staff()/is_super_admin() de ahí).
-- Una sola vez, en Supabase Studio -> SQL Editor.

-- ─────────────────────────────────────────────────────────
-- EVENTOS
-- ─────────────────────────────────────────────────────────
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  venue text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists ix_events_status_starts on events (status, starts_at);

-- ─────────────────────────────────────────────────────────
-- TIPOS DE ENTRADA (por evento)
-- ─────────────────────────────────────────────────────────
create table if not exists ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  price_clp int not null check (price_clp >= 0),
  quantity_total int not null check (quantity_total >= 0),
  quantity_sold int not null default 0 check (quantity_sold >= 0),
  max_per_order int not null default 10 check (max_per_order > 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint ticket_types_sold_within_total check (quantity_sold <= quantity_total)
);

create index if not exists ix_ticket_types_event on ticket_types (event_id);

-- ─────────────────────────────────────────────────────────
-- ÓRDENES DE COMPRA (1 pago de Mercado Pago = 1 orden, puede
-- incluir varios tipos de entrada y cantidades)
-- ─────────────────────────────────────────────────────────
create table if not exists ticket_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'cancelled', 'expired')),
  total_amount_clp int not null,
  mp_preference_id text,
  mp_payment_id text,
  expires_at timestamptz, -- solo mientras status = pending_payment
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_ticket_orders_event on ticket_orders (event_id);

drop trigger if exists trg_ticket_orders_updated_at on ticket_orders;
create trigger trg_ticket_orders_updated_at
  before update on ticket_orders
  for each row execute function set_updated_at(); -- reutiliza la función de schema.sql

create table if not exists ticket_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references ticket_orders (id) on delete cascade,
  ticket_type_id uuid not null references ticket_types (id),
  quantity int not null check (quantity > 0),
  unit_price_clp int not null -- snapshot del precio al momento de comprar
);

create index if not exists ix_ticket_order_items_order on ticket_order_items (order_id);

-- payment_events (de schema.sql) también audita pagos de entradas — se le
-- agrega una segunda referencia opcional (una fila usa booking_id O
-- ticket_order_id, nunca ambas).
alter table payment_events add column if not exists ticket_order_id uuid references ticket_orders (id);

-- ─────────────────────────────────────────────────────────
-- ENTRADAS INDIVIDUALES (1 fila = 1 admisión escaneable)
-- Se crean recién cuando el pago de la orden se aprueba.
-- ─────────────────────────────────────────────────────────
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references ticket_orders (id),
  ticket_type_id uuid not null references ticket_types (id),
  event_id uuid not null references events (id),
  code text not null unique,
  status text not null default 'valid' check (status in ('valid', 'used', 'cancelled')),
  used_at timestamptz,
  used_by_staff_id uuid references staff_users (id),
  created_at timestamptz not null default now()
);

create index if not exists ix_tickets_event on tickets (event_id);
create index if not exists ix_tickets_order on tickets (order_id);

-- ─────────────────────────────────────────────────────────
-- Reserva/liberación atómica de cupos (evita sobreventa por
-- condición de carrera: la comprobación y el incremento son
-- una sola sentencia UPDATE, no un SELECT + UPDATE separado).
-- ─────────────────────────────────────────────────────────
create or replace function reserve_ticket_type(p_ticket_type_id uuid, p_qty int)
returns boolean as $$
declare
  affected int;
begin
  update ticket_types
    set quantity_sold = quantity_sold + p_qty
    where id = p_ticket_type_id
      and active
      and quantity_sold + p_qty <= quantity_total;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$ language plpgsql security definer;

create or replace function release_ticket_type(p_ticket_type_id uuid, p_qty int)
returns void as $$
begin
  update ticket_types
    set quantity_sold = greatest(0, quantity_sold - p_qty)
    where id = p_ticket_type_id;
end;
$$ language plpgsql security definer;

-- Libera las órdenes "pendiente de pago" abandonadas (igual que
-- expire_stale_bookings, pero además devuelve el cupo reservado).
create or replace function expire_stale_ticket_orders()
returns void as $$
declare
  ord record;
  item record;
begin
  for ord in
    select id from ticket_orders
      where status = 'pending_payment' and expires_at is not null and expires_at < now()
  loop
    for item in select ticket_type_id, quantity from ticket_order_items where order_id = ord.id loop
      perform release_ticket_type(item.ticket_type_id, item.quantity);
    end loop;
    update ticket_orders set status = 'expired' where id = ord.id;
  end loop;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────
alter table events enable row level security;
alter table ticket_types enable row level security;
alter table ticket_orders enable row level security;
alter table ticket_order_items enable row level security;
alter table tickets enable row level security;

-- events / ticket_types: el staff ve el catálogo (para check-in y
-- soporte), solo super_admin crea/edita/borra (igual que services).
drop policy if exists events_select on events;
create policy events_select on events for select using (is_active_staff());
drop policy if exists events_write on events;
create policy events_write on events for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists ticket_types_select on ticket_types;
create policy ticket_types_select on ticket_types for select using (is_active_staff());
drop policy if exists ticket_types_write on ticket_types;
create policy ticket_types_write on ticket_types for all
  using (is_super_admin()) with check (is_super_admin());

-- ticket_orders / ticket_order_items: el staff puede ver (soporte a
-- clientes), sin insert/update/delete desde el panel (esas escrituras
-- las hace siempre el servidor con service_role: compra pública +
-- webhook de Mercado Pago).
drop policy if exists ticket_orders_select on ticket_orders;
create policy ticket_orders_select on ticket_orders for select using (is_active_staff());
drop policy if exists ticket_order_items_select on ticket_order_items;
create policy ticket_order_items_select on ticket_order_items for select using (is_active_staff());

-- tickets: el staff necesita UPDATE para hacer check-in (marcar 'used').
drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets for select using (is_active_staff());
drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets for update
  using (is_active_staff()) with check (is_active_staff());
