-- =====================================================================
--  TALUNA — Panel · Store config
--  Corre esto UNA VEZ. Idempotente. El equipo se maneja en profiles.
-- =====================================================================

create table if not exists public.store_config (
  id              text        primary key default 'main',
  store_name      text        not null default 'Taluna MX',
  currency        text        not null default 'MXN',
  monthly_goal    numeric     not null default 0,
  phone           text,
  email           text,
  whatsapp_number text,
  instagram       text,
  address         text,
  shipping        jsonb       not null default '{}'::jsonb,
  payments        jsonb       not null default '{}'::jsonb,
  integrations    jsonb       not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

insert into public.store_config (id) values ('main') on conflict (id) do nothing;

drop trigger if exists trg_store_config_updated_at on public.store_config;
create trigger trg_store_config_updated_at before update on public.store_config
  for each row execute function public.set_updated_at();

alter table public.store_config enable row level security;
