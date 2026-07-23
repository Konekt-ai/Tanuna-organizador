-- =====================================================================
--  TALUNA — Panel · Fase 3: Clientas (CRM) + Pedidos
--  Corre esto UNA VEZ en Supabase -> SQL Editor. Idempotente.
--  Requiere catalog-setup.sql e inventario-setup.sql (los pedidos descuentan
--  inventario al enviarse).
-- =====================================================================

-- 1) Clientas (CRM) ---------------------------------------------------------
create table if not exists public.clientas (
  id               uuid        primary key default gen_random_uuid(),
  nombre           text        not null,
  telefono         text,
  correo           text,
  canal_origen     text        check (canal_origen in ('WhatsApp', 'Instagram', 'Popup', 'Formulario', 'Compra', 'Otro')),
  estatus          text        not null default 'Nueva clienta'
                    check (estatus in ('Compra realizada', 'Espera respuesta', 'Preguntó por un producto', 'Nueva clienta', 'No continuó la compra')),
  producto_interes text,
  ultimo_contacto  date,
  nota             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists clientas_estatus_idx on public.clientas (estatus);

-- 2) Folio de pedidos (secuencia en la BD, sin colisiones) ------------------
create sequence if not exists public.pedido_folio_seq start 1043;

-- 3) Pedidos ----------------------------------------------------------------
create table if not exists public.pedidos (
  id             uuid        primary key default gen_random_uuid(),
  folio          text        not null unique default ('T-' || nextval('public.pedido_folio_seq')::text),
  clienta_id     uuid        references public.clientas (id) on delete set null,
  fecha          date        not null default current_date,
  estado_pago    text        not null default 'Pendiente de pago'
                  check (estado_pago in ('Pendiente de pago', 'Pagado', 'Reembolsado')),
  estado_envio   text        not null default 'Nuevo pedido'
                  check (estado_envio in ('Nuevo pedido', 'Preparando', 'Enviado', 'Entregado', 'Cancelado')),
  total          numeric(10, 2) not null default 0,
  notas_internas text,
  guia_url       text,
  stock_aplicado boolean     not null default false,
  usuario_id     uuid        references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists pedidos_clienta_idx on public.pedidos (clienta_id);
create index if not exists pedidos_envio_idx on public.pedidos (estado_envio);

-- 4) Líneas del pedido ------------------------------------------------------
create table if not exists public.pedido_items (
  id              uuid        primary key default gen_random_uuid(),
  pedido_id       uuid        not null references public.pedidos (id) on delete cascade,
  variante_id     uuid        references public.producto_variantes (id) on delete set null,
  combinacion_id  uuid        references public.combinaciones (id) on delete set null,
  descripcion     text,
  cantidad        int         not null default 1 check (cantidad > 0),
  precio_unitario numeric(10, 2) not null default 0
);
create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);

-- 5) Triggers de updated_at -------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['clientas', 'pedidos']
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I;', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- 6) RLS: cerrado al público; escritura por el servidor (service_role) ------
alter table public.clientas     enable row level security;
alter table public.pedidos      enable row level security;
alter table public.pedido_items enable row level security;
