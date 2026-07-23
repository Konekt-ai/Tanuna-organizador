-- =====================================================================
--  TALUNA — Panel · Roles (profiles)
--  Corre esto UNA VEZ en Supabase -> SQL Editor. Idempotente.
--  Se alinea al esquema existente en inglés. Los valores de `role` son
--  'fundadora' / 'staff' (los usa el panel para autorizar).
-- =====================================================================

create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  name         text        not null default '',
  initials     text,
  role         text        not null default 'staff' check (role in ('fundadora', 'staff')),
  avatar_color text        default 'oklch(0.62 0.14 40)',
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- Alta automática de perfil al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    upper(left(coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), new.email), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rellena las cuentas que ya existían.
insert into public.profiles (id, name, initials)
select u.id, split_part(u.email, '@', 1), upper(left(u.email, 2))
from auth.users u
on conflict (id) do nothing;

-- Helpers de autorización.
create or replace function public.is_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'fundadora' and is_active);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;

-- RLS.
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles for select using (id = auth.uid());

drop policy if exists "profiles_founder_select" on public.profiles;
create policy "profiles_founder_select" on public.profiles for select using (public.is_founder());

drop policy if exists "profiles_founder_update" on public.profiles;
create policy "profiles_founder_update" on public.profiles for update using (public.is_founder()) with check (public.is_founder());

-- BOOTSTRAP (opcional): marca a la fundadora por correo y córrelo una vez.
-- update public.profiles set role = 'fundadora'
--   where id = (select id from auth.users where lower(email) = lower('CORREO@ejemplo.com'));
