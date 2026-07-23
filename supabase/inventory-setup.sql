-- =====================================================================
--  TALUNA — Panel · Inventory movements
--  Corre esto UNA VEZ. Idempotente. Requiere `product_variants`.
--  Un trigger aplica el movimiento a product_variants.stock, impide stock
--  negativo y actualiza is_active (agotado -> false).
-- =====================================================================

create table if not exists public.inventory_movements (
  id         uuid        primary key default gen_random_uuid(),
  variant_id uuid        not null references public.product_variants (id) on delete cascade,
  type       text        not null check (type in ('entrada', 'salida', 'ajuste')),
  delta      int         not null,
  reason     text,
  note       text,
  order_id   uuid,
  user_id    uuid        references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inv_mov_variant_idx on public.inventory_movements (variant_id);
create index if not exists inv_mov_date_idx on public.inventory_movements (created_at desc);

create or replace function public.apply_inventory_movement()
returns trigger language plpgsql as $$
declare current_stock int;
begin
  select stock into current_stock from public.product_variants where id = new.variant_id for update;
  if current_stock is null then
    raise exception 'La variante indicada no existe.';
  end if;
  if current_stock + new.delta < 0 then
    raise exception 'Stock insuficiente: hay % piezas y quieres mover %.', current_stock, new.delta;
  end if;
  update public.product_variants
    set stock = current_stock + new.delta,
        is_active = (current_stock + new.delta) > 0
    where id = new.variant_id;
  return new;
end;
$$;

drop trigger if exists trg_apply_inventory on public.inventory_movements;
create trigger trg_apply_inventory
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

alter table public.inventory_movements enable row level security;
