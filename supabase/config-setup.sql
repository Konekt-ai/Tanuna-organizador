-- =====================================================================
--  TALUNA — Panel · Fase 5: Configuración de la tienda
--  Corre esto UNA VEZ en Supabase -> SQL Editor. Idempotente.
--  El equipo (staff/fundadora) se maneja sobre la tabla profiles
--  (ver roles-setup.sql); aquí solo se crean los ajustes de la tienda.
-- =====================================================================

create table if not exists public.config_tienda (
  id              text        primary key default 'main',
  nombre_tienda   text        not null default 'Taluna MX',
  moneda          text        not null default 'MXN',
  meta_mensual    numeric     not null default 0,
  telefono        text,
  correo          text,
  whatsapp_numero text,
  instagram       text,
  direccion       text,
  envios          jsonb       not null default '{}'::jsonb,
  pagos           jsonb       not null default '{}'::jsonb,
  integraciones   jsonb       not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

-- Fila única de configuración.
insert into public.config_tienda (id) values ('main') on conflict (id) do nothing;

-- updated_at automático.
drop trigger if exists trg_config_tienda_updated_at on public.config_tienda;
create trigger trg_config_tienda_updated_at
  before update on public.config_tienda
  for each row execute function public.set_updated_at();

-- RLS: cerrado al público; escritura por el servidor (service_role), y en el
-- servidor solo la fundadora (ver requireFundadora en lib/auth.js).
alter table public.config_tienda enable row level security;
