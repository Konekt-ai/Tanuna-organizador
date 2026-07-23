-- =====================================================================
--  TALUNA — Panel · Fase 6: WhatsApp (flujos, plantillas y mensajes)
--  Corre esto UNA VEZ en Supabase -> SQL Editor. Idempotente.
--  Incluye datos semilla (flujos y plantillas) para arrancar.
--
--  Hoy el envío es por enlace wa.me (gratis, sin aprobación). El campo
--  `canal` deja lugar para la Cloud API de Meta (cloud_api) más adelante.
-- =====================================================================

-- 1) Flujos automatizados ---------------------------------------------------
create table if not exists public.wa_flujos (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique,
  nombre     text        not null,
  disparador text,
  estado     text        not null default 'activo' check (estado in ('activo', 'pausado')),
  orden      int         not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Plantillas por tono ----------------------------------------------------
create table if not exists public.wa_plantillas (
  id         uuid        primary key default gen_random_uuid(),
  flujo_id   uuid        not null references public.wa_flujos (id) on delete cascade,
  tono       text        not null check (tono in ('calida', 'directa')),
  contenido  text        not null,
  created_at timestamptz not null default now()
);
create unique index if not exists wa_plantillas_flujo_tono_key on public.wa_plantillas (flujo_id, tono);

-- 3) Mensajes (log de envíos / simulaciones) --------------------------------
create table if not exists public.wa_mensajes (
  id           uuid        primary key default gen_random_uuid(),
  clienta_id   uuid        references public.clientas (id) on delete set null,
  flujo_id     uuid        references public.wa_flujos (id) on delete set null,
  plantilla_id uuid        references public.wa_plantillas (id) on delete set null,
  pedido_id    uuid,
  contenido    text,
  canal        text        not null default 'wa_me' check (canal in ('wa_me', 'simulado', 'cloud_api')),
  estado       text        not null default 'enviado',
  usuario_id   uuid        references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists wa_mensajes_fecha_idx on public.wa_mensajes (created_at desc);

-- 4) updated_at + RLS -------------------------------------------------------
drop trigger if exists trg_wa_flujos_updated_at on public.wa_flujos;
create trigger trg_wa_flujos_updated_at before update on public.wa_flujos
  for each row execute function public.set_updated_at();

alter table public.wa_flujos     enable row level security;
alter table public.wa_plantillas enable row level security;
alter table public.wa_mensajes   enable row level security;

-- 5) Semilla de flujos ------------------------------------------------------
insert into public.wa_flujos (slug, nombre, disparador, estado, orden) values
  ('bienvenida',      'Mensaje de bienvenida',   'Primer mensaje',                'activo',  1),
  ('producto-interes','Producto de interés',     'Cliente pregunta por producto', 'activo',  2),
  ('carrito',         'Carrito abandonado',      'Carrito > 2h sin compra',       'activo',  3),
  ('confirmacion',    'Confirmación de pedido',  'Pedido pagado',                 'activo',  4),
  ('envio',           'Seguimiento de envío',    'Pedido enviado',                'activo',  5),
  ('dudas',           'Dudas frecuentes',        'Palabras clave',                'pausado', 6),
  ('asesor',          'Contacto humano',         'Cliente escribe "asesor"',      'activo',  7)
on conflict (slug) do nothing;

-- 6) Semilla de plantillas (variables: {{nombre}}, {{producto}}, {{pedido}}) -
insert into public.wa_plantillas (flujo_id, tono, contenido)
select f.id, v.tono, v.contenido
from (values
  ('bienvenida','calida','Hola {{nombre}} 🤎 Gracias por escribir a Taluna. Cada pieza está hecha a mano en México. ¿En qué te podemos ayudar hoy?'),
  ('bienvenida','directa','Hola {{nombre}}, soy de Taluna. ¿Qué pieza te interesa?'),
  ('producto-interes','calida','¡{{nombre}}, excelente elección! La {{producto}} es de nuestras favoritas 😍 ¿Te comparto colores y precio?'),
  ('carrito','calida','Hola {{nombre}}, vi que te quedaste viendo la {{producto}}. La aparto para ti unas horas por si la quieres 💛'),
  ('confirmacion','calida','¡Gracias por tu compra, {{nombre}}! Tu pedido {{pedido}} ya está confirmado. Te aviso cuando salga tu envío 📦'),
  ('envio','calida','{{nombre}}, tu pedido {{pedido}} ya va en camino 🚚 Te comparto la guía en cuanto la tenga.'),
  ('asesor','calida','Hola {{nombre}}, con gusto te atiende una asesora de Taluna. Cuéntanos qué necesitas 🤎')
) as v(slug, tono, contenido)
join public.wa_flujos f on f.slug = v.slug
on conflict (flujo_id, tono) do nothing;
