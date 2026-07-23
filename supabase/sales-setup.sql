-- =====================================================================
--  TALUNA — Panel · Customers (CRM) + Orders
--  Corre esto UNA VEZ. Idempotente. Requiere product_variants, combinations,
--  inventory_movements (los pedidos descuentan inventario al enviarse).
-- =====================================================================

-- Customers (CRM) -----------------------------------------------------------
create table if not exists public.customers (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  phone            text,
  email            text,
  source           text        check (source in ('WhatsApp', 'Instagram', 'Popup', 'Formulario', 'Compra', 'Otro')),
  status           text        not null default 'Nueva clienta'
                    check (status in ('Compra realizada', 'Espera respuesta', 'Preguntó por un producto', 'Nueva clienta', 'No continuó la compra')),
  product_interest text,
  last_contact     date,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists customers_status_idx on public.customers (status);

-- Folio de pedidos ----------------------------------------------------------
create sequence if not exists public.order_folio_seq start 1043;

-- Orders --------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid        primary key default gen_random_uuid(),
  folio              text        not null unique default ('T-' || nextval('public.order_folio_seq')::text),
  customer_id        uuid        references public.customers (id) on delete set null,
  order_date         date        not null default current_date,
  payment_status     text        not null default 'Pendiente de pago'
                     check (payment_status in ('Pendiente de pago', 'Pagado', 'Reembolsado')),
  fulfillment_status text        not null default 'Nuevo pedido'
                     check (fulfillment_status in ('Nuevo pedido', 'Preparando', 'Enviado', 'Entregado', 'Cancelado')),
  total              numeric(10, 2) not null default 0,
  internal_notes     text,
  tracking_url       text,
  stock_applied      boolean     not null default false,
  user_id            uuid        references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_fulfillment_idx on public.orders (fulfillment_status);

-- Order items ---------------------------------------------------------------
create table if not exists public.order_items (
  id             uuid        primary key default gen_random_uuid(),
  order_id       uuid        not null references public.orders (id) on delete cascade,
  variant_id     uuid        references public.product_variants (id) on delete set null,
  combination_id uuid        references public.combinations (id) on delete set null,
  description    text,
  quantity       int         not null default 1 check (quantity > 0),
  unit_price     numeric(10, 2) not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- updated_at ----------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['customers', 'orders']
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I;', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
