-- =====================================================================
--  TALUNA — Panel · Fase 2: Inventario
--  Corre esto UNA VEZ en Supabase -> SQL Editor. Idempotente.
--  Requiere que ya exista catalog-setup.sql (usa producto_variantes).
--
--  Registra movimientos de stock (entradas/salidas/ajustes). Un trigger aplica
--  el movimiento sobre producto_variantes.stock de forma transaccional, impide
--  dejar stock negativo, y actualiza el estado (disponible/agotado).
-- =====================================================================

create table if not exists public.movimientos_inventario (
  id          uuid        primary key default gen_random_uuid(),
  variante_id uuid        not null references public.producto_variantes (id) on delete cascade,
  tipo        text        not null check (tipo in ('entrada', 'salida', 'ajuste')),
  delta       int         not null,           -- cambio con signo (+entra / -sale)
  motivo      text,
  nota        text,
  pedido_id   uuid,                            -- se enlaza en la Fase 3 (Pedidos)
  usuario_id  uuid        references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists movimientos_variante_idx on public.movimientos_inventario (variante_id);
create index if not exists movimientos_fecha_idx on public.movimientos_inventario (created_at desc);

-- Trigger: aplica el movimiento al stock de la variante (transaccional).
create or replace function public.aplicar_movimiento_inventario()
returns trigger
language plpgsql
as $$
declare
  actual int;
begin
  select stock into actual from public.producto_variantes where id = new.variante_id for update;
  if actual is null then
    raise exception 'La variante indicada no existe.';
  end if;
  if actual + new.delta < 0 then
    raise exception 'Stock insuficiente: hay % piezas y quieres mover %.', actual, new.delta;
  end if;
  update public.producto_variantes
    set stock  = actual + new.delta,
        estado = case when actual + new.delta <= 0 then 'agotado' else 'disponible' end
    where id = new.variante_id;
  return new;
end;
$$;

drop trigger if exists trg_aplicar_movimiento on public.movimientos_inventario;
create trigger trg_aplicar_movimiento
  after insert on public.movimientos_inventario
  for each row execute function public.aplicar_movimiento_inventario();

-- RLS: cerrado al público; escritura por el servidor (service_role).
alter table public.movimientos_inventario enable row level security;
