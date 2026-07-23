-- =====================================================================
--  TALUNA — Panel · Fase 1: Catálogo relacional
--  Corre esto UNA VEZ en Supabase -> SQL Editor -> New query.
--  Idempotente. Crea las tablas del catálogo real (categorías, productos,
--  variantes, imágenes y combinaciones) que reemplazan poco a poco al
--  documento único del Organizador (studio_docs).
--
--  Patrón de seguridad (igual que studio_docs): RLS activado y SIN políticas
--  para anónimos. Todas las lecturas/escrituras pasan por el servidor con la
--  SERVICE_ROLE_KEY, autorizando por rol (ver roles-setup.sql).
--
--  La columna `origen_id` guarda el id que traía cada registro en el blob del
--  Organizador, para que la migración pueda correrse varias veces sin duplicar.
-- =====================================================================

-- Garantiza la función de updated_at (ya existe si corriste studio-setup.sql).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Categorías -------------------------------------------------------------
create table if not exists public.categorias (
  id         uuid        primary key default gen_random_uuid(),
  nombre     text        not null,
  slug       text        not null,
  orden      int         not null default 0,
  estado     text        not null default 'activo' check (estado in ('activo', 'inactivo')),
  imagen_url text,
  origen_id  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categorias_slug_key on public.categorias (slug);
create unique index if not exists categorias_origen_key on public.categorias (origen_id) where origen_id is not null;

-- 2) Productos --------------------------------------------------------------
create table if not exists public.productos (
  id                uuid        primary key default gen_random_uuid(),
  tipo              text        not null default 'bolsa' check (tipo in ('bolsa', 'strap', 'cinturon')),
  nombre            text        not null,
  slug              text        not null,
  categoria_id      uuid        references public.categorias (id) on delete set null,
  descripcion_corta text,
  descripcion_larga text,
  precio_base       numeric(10, 2) not null default 0,
  estado            text        not null default 'borrador' check (estado in ('publicado', 'borrador')),
  destacado         boolean     not null default false,
  orden             int         not null default 0,
  dim_alto          numeric,
  dim_ancho         numeric,
  dim_largo         numeric,
  materiales        text,
  cuidados          text,
  extra             jsonb       not null default '{}'::jsonb,
  origen_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists productos_slug_key on public.productos (slug);
create unique index if not exists productos_origen_key on public.productos (origen_id) where origen_id is not null;
create index if not exists productos_tipo_idx on public.productos (tipo);
create index if not exists productos_categoria_idx on public.productos (categoria_id);

-- 3) Variantes por color (nivel de stock) -----------------------------------
create table if not exists public.producto_variantes (
  id          uuid        primary key default gen_random_uuid(),
  producto_id uuid        not null references public.productos (id) on delete cascade,
  color       text        not null default '',
  color_hex   text,
  sku         text,
  stock       int         not null default 0 check (stock >= 0),
  estado      text        not null default 'disponible' check (estado in ('disponible', 'agotado', 'oculto')),
  orden       int         not null default 0,
  origen_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists variantes_producto_idx on public.producto_variantes (producto_id);
create unique index if not exists variantes_origen_key on public.producto_variantes (origen_id) where origen_id is not null;

-- 4) Imágenes de producto ---------------------------------------------------
create table if not exists public.producto_imagenes (
  id          uuid        primary key default gen_random_uuid(),
  producto_id uuid        not null references public.productos (id) on delete cascade,
  variante_id uuid        references public.producto_variantes (id) on delete set null,
  url         text        not null,
  rol         text,
  es_muestra  boolean     not null default false,
  orden       int         not null default 0,
  origen_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists imagenes_producto_idx on public.producto_imagenes (producto_id);
create unique index if not exists imagenes_origen_key on public.producto_imagenes (origen_id) where origen_id is not null;

-- 5) Combinaciones (Arma tu Taluna) -----------------------------------------
create table if not exists public.combinaciones (
  id                uuid        primary key default gen_random_uuid(),
  bolsa_id          uuid        references public.productos (id) on delete cascade,
  strap_id          uuid        references public.productos (id) on delete cascade,
  color             text,
  largo             text        check (largo is null or largo in ('Corto', 'Medio', 'Largo')),
  extra_strap       numeric(10, 2) not null default 0,
  precio_final      numeric(10, 2),
  stock             int         not null default 0,
  estado            text        not null default 'activo' check (estado in ('activo', 'inactivo')),
  lista_para_tienda boolean     not null default false,
  origen_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists combinaciones_bolsa_idx on public.combinaciones (bolsa_id);
create index if not exists combinaciones_strap_idx on public.combinaciones (strap_id);
create unique index if not exists combinaciones_origen_key on public.combinaciones (origen_id) where origen_id is not null;

-- 6) Triggers de updated_at -------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['categorias', 'productos', 'producto_variantes', 'combinaciones']
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I;', t, t);
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- 7) RLS: cerrado al público; el servidor escribe con service_role ----------
alter table public.categorias         enable row level security;
alter table public.productos          enable row level security;
alter table public.producto_variantes enable row level security;
alter table public.producto_imagenes  enable row level security;
alter table public.combinaciones      enable row level security;
