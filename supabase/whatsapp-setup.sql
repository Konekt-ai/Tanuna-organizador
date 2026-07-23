-- =====================================================================
--  TALUNA — Panel · WhatsApp (flows, templates, messages)
--  Corre esto UNA VEZ. Idempotente. Incluye datos semilla.
--  Hoy el envío es por enlace wa.me; `channel` deja lugar para la Cloud API.
-- =====================================================================

create table if not exists public.wa_flows (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,
  name         text        not null,
  trigger_text text,
  status       text        not null default 'activo' check (status in ('activo', 'pausado')),
  position     int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.wa_templates (
  id         uuid        primary key default gen_random_uuid(),
  flow_id    uuid        not null references public.wa_flows (id) on delete cascade,
  tone       text        not null check (tone in ('calida', 'directa')),
  content    text        not null,
  created_at timestamptz not null default now()
);
create unique index if not exists wa_templates_flow_tone_key on public.wa_templates (flow_id, tone);

create table if not exists public.wa_messages (
  id          uuid        primary key default gen_random_uuid(),
  customer_id uuid        references public.customers (id) on delete set null,
  flow_id     uuid        references public.wa_flows (id) on delete set null,
  template_id uuid        references public.wa_templates (id) on delete set null,
  order_id    uuid,
  content     text,
  channel     text        not null default 'wa_me' check (channel in ('wa_me', 'simulado', 'cloud_api')),
  status      text        not null default 'enviado',
  user_id     uuid        references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists wa_messages_date_idx on public.wa_messages (created_at desc);

drop trigger if exists trg_wa_flows_updated_at on public.wa_flows;
create trigger trg_wa_flows_updated_at before update on public.wa_flows
  for each row execute function public.set_updated_at();

alter table public.wa_flows     enable row level security;
alter table public.wa_templates enable row level security;
alter table public.wa_messages  enable row level security;

-- Semilla de flujos ---------------------------------------------------------
insert into public.wa_flows (slug, name, trigger_text, status, position) values
  ('bienvenida',      'Mensaje de bienvenida',   'Primer mensaje',                'activo',  1),
  ('producto-interes','Producto de interés',     'Cliente pregunta por producto', 'activo',  2),
  ('carrito',         'Carrito abandonado',      'Carrito > 2h sin compra',       'activo',  3),
  ('confirmacion',    'Confirmación de pedido',  'Pedido pagado',                 'activo',  4),
  ('envio',           'Seguimiento de envío',    'Pedido enviado',                'activo',  5),
  ('dudas',           'Dudas frecuentes',        'Palabras clave',                'pausado', 6),
  ('asesor',          'Contacto humano',         'Cliente escribe "asesor"',      'activo',  7)
on conflict (slug) do nothing;

insert into public.wa_templates (flow_id, tone, content)
select f.id, v.tone, v.content
from (values
  ('bienvenida','calida','Hola {{nombre}} 🤎 Gracias por escribir a Taluna. Cada pieza está hecha a mano en México. ¿En qué te podemos ayudar hoy?'),
  ('bienvenida','directa','Hola {{nombre}}, soy de Taluna. ¿Qué pieza te interesa?'),
  ('producto-interes','calida','¡{{nombre}}, excelente elección! La {{producto}} es de nuestras favoritas 😍 ¿Te comparto colores y precio?'),
  ('carrito','calida','Hola {{nombre}}, vi que te quedaste viendo la {{producto}}. La aparto para ti unas horas por si la quieres 💛'),
  ('confirmacion','calida','¡Gracias por tu compra, {{nombre}}! Tu pedido {{pedido}} ya está confirmado. Te aviso cuando salga tu envío 📦'),
  ('envio','calida','{{nombre}}, tu pedido {{pedido}} ya va en camino 🚚 Te comparto la guía en cuanto la tenga.'),
  ('asesor','calida','Hola {{nombre}}, con gusto te atiende una asesora de Taluna. Cuéntanos qué necesitas 🤎')
) as v(slug, tone, content)
join public.wa_flows f on f.slug = v.slug
on conflict (flow_id, tone) do nothing;
