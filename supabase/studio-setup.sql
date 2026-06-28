-- =====================================================================
--  TALUNA — Organizador (Product Studio)
--  Corre esto UNA VEZ en Supabase -> SQL Editor -> New query.
--  Es autocontenido: crea la tabla, el trigger y el bucket que necesita
--  el Organizador. Se puede correr varias veces sin romper nada.
--
--  El Organizador (/estudio.html) lo llena la dueña desde el celular para
--  organizar bolsas, straps, cinturones, combinaciones y subir fotos.
--  Todo se guarda en la nube:
--    - El estado completo (datos) -> tabla public.studio_docs (1 fila, JSON).
--    - Las fotos                  -> bucket de Storage "studio" (público).
--
--  Las ESCRITURAS se hacen en el servidor con la SERVICE_ROLE_KEY (igual que
--  el resto del panel), así que la tabla queda CERRADA al público con RLS y
--  sin políticas: nadie anónimo puede leerla ni escribirla.
-- =====================================================================

-- 1) Tabla de estado del organizador ---------------------------------------
create table if not exists public.studio_docs (
  id         text        primary key,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Reutiliza/garantiza la función que mantiene updated_at al día.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_studio_docs_updated_at on public.studio_docs;
create trigger trg_studio_docs_updated_at
  before update on public.studio_docs
  for each row execute function public.set_updated_at();

-- Fila inicial vacía (el panel usa el id fijo 'main').
insert into public.studio_docs (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Cierra la tabla al público: solo el servidor (service_role, que SALTA RLS)
-- puede leer/escribir. Sin políticas = nadie anónimo entra.
alter table public.studio_docs enable row level security;

-- 2) Bucket de fotos del organizador (público de lectura) ------------------
insert into storage.buckets (id, name, public)
values ('studio', 'studio', true)
on conflict (id) do update set public = true;
