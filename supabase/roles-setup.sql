-- =====================================================================
--  TALUNA — Panel · Fase 0b: Usuarios y roles
--  Corre esto UNA VEZ en Supabase -> SQL Editor -> New query.
--  Es idempotente (se puede correr varias veces sin romper nada).
--
--  Crea la tabla public.profiles (una fila por cuenta de auth), un trigger
--  que da de alta el perfil automáticamente al registrarse, funciones helper
--  para autorizar por rol, y las políticas RLS.
--
--  Roles: 'fundadora' (Roxana/Cristy — acceso total) y 'staff' (equipo).
--  Por defecto toda cuenta nueva entra como 'staff'. Al final hay un paso
--  (comentado) para marcar a la fundadora.
-- =====================================================================

-- 1) Tabla de perfiles ------------------------------------------------------
create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  nombre       text        not null default '',
  iniciales    text,
  rol          text        not null default 'staff' check (rol in ('fundadora', 'staff')),
  avatar_color text        default 'oklch(0.62 0.14 40)',
  activo       boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- 2) Alta automática de perfil al registrarse una cuenta --------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, iniciales)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    upper(left(coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), new.email), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rellena los perfiles de las cuentas que ya existían.
insert into public.profiles (id, nombre, iniciales)
select
  u.id,
  split_part(u.email, '@', 1),
  upper(left(u.email, 2))
from auth.users u
on conflict (id) do nothing;

-- 3) Helpers de autorización (SECURITY DEFINER = saltan RLS, sin recursión) --
create or replace function public.is_fundadora()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'fundadora' and activo
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and activo
  );
$$;

-- 4) RLS de profiles --------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_fundadora_select" on public.profiles;
create policy "profiles_fundadora_select" on public.profiles
  for select using (public.is_fundadora());

drop policy if exists "profiles_fundadora_update" on public.profiles;
create policy "profiles_fundadora_update" on public.profiles
  for update using (public.is_fundadora()) with check (public.is_fundadora());

-- 5) BOOTSTRAP: marca a la fundadora ---------------------------------------
--    Descomenta y pon el correo de la dueña; córrelo una vez.
--
-- update public.profiles set rol = 'fundadora'
--   where id = (select id from auth.users where lower(email) = lower('CORREO_DE_LA_DUENA@ejemplo.com'));
