-- =====================================================================
--  TALUNA — Panel · Combinations (Arma tu Taluna)
--  Corre esto UNA VEZ. Idempotente. Requiere la tabla existente `products`.
--  Una combinación empareja un producto-bolsa con un producto-strap.
-- =====================================================================

create table if not exists public.combinations (
  id               uuid        primary key default gen_random_uuid(),
  bag_product_id   uuid        references public.products (id) on delete cascade,
  strap_product_id uuid        references public.products (id) on delete cascade,
  color            text,
  length           text        check (length is null or length in ('Corto', 'Medio', 'Largo')),
  extra_price      numeric(10, 2) not null default 0,
  final_price      numeric(10, 2),
  stock            int         not null default 0,
  is_active        boolean     not null default true,
  ready_for_store  boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists combinations_bag_idx on public.combinations (bag_product_id);
create index if not exists combinations_strap_idx on public.combinations (strap_product_id);

drop trigger if exists trg_combinations_updated_at on public.combinations;
create trigger trg_combinations_updated_at before update on public.combinations
  for each row execute function public.set_updated_at();

alter table public.combinations enable row level security;
