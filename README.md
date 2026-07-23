# Taluna · Panel

**Panel administrativo interno** de **Taluna MX** (bolsas artesanales). Un solo
lugar para llevar el negocio: catálogo, inventario, pedidos, clientas (CRM),
reportes, configuración y WhatsApp. Todo se guarda **en la nube** (Supabase)
detrás de un **login**. UI 100 % en español, mobile-first, con **modo claro/oscuro**.

> Se construyó sobre el **Organizador de catálogo** original (`public/estudio.html`),
> que sigue disponible y del que se puede **migrar** el catálogo al panel nuevo.

---

## Stack

- **Next.js 14** (App Router) + **React** + **Tailwind CSS** (tokens en OKLCH,
  tema claro/oscuro con `next-themes`, iconos `lucide-react`).
- **Supabase**: Auth (correo + contraseña), Postgres y Storage.
- Todas las **escrituras** se hacen en el servidor con la llave `service_role`
  (Server Actions y rutas API), autorizando por rol. Las tablas tienen **RLS
  activado** y cerradas al público.
- Desplegable en **Vercel**.

---

## Las 10 secciones

| Sección | Qué hace |
| --- | --- |
| **Inicio** | Dashboard con KPIs reales (ventas, pedidos, clientas, piezas) |
| **Pedidos** | Alta con folio `T-####` y líneas; al **marcar enviado descuenta inventario** |
| **Clientas (CRM)** | Contactos, estatus, seguimiento; responder por **WhatsApp** o correo |
| **WhatsApp** | Flujos + plantillas por tono; enviar por `wa.me` con vista previa |
| **Productos** | Catálogo con variantes por color, fotos y estado de publicación |
| **Categorías** | Alta/edición/orden de categorías |
| **Arma tu Taluna** | Combinaciones bolsa + color + strap + largo |
| **Inventario** | Movimientos (entrada/salida/ajuste), historial y KPIs; sin stock negativo |
| **Reportes** | Ventas por día, más vendidos, qué reponer y canales (solo lectura) |
| **Configuración** | Datos de tienda, envíos y **equipo** (roles Fundadora / Equipo) |

---

## Puesta en marcha

### 1. Proyecto en Supabase y llaves

1. <https://supabase.com> → **New project**.
2. **Project Settings → API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Correr los scripts SQL — **en este orden**

En Supabase → **SQL Editor → New query**, pega y ejecuta cada archivo de la
carpeta [`supabase/`](supabase/). Todos son **idempotentes** (se pueden correr
más de una vez):

| # | Archivo | Crea |
| --- | --- | --- |
| 1 | `studio-setup.sql` | Organizador: `studio_docs` + bucket `studio` + `set_updated_at()` |
| 2 | `roles-setup.sql` | `profiles` + roles (Fundadora/Equipo) + RLS |
| 3 | `catalog-setup.sql` | `categorias`, `productos`, `producto_variantes`, `producto_imagenes`, `combinaciones` |
| 4 | `inventario-setup.sql` | `movimientos_inventario` + trigger que ajusta el stock |
| 5 | `ventas-setup.sql` | `clientas`, `pedidos`, `pedido_items` + folio `T-####` |
| 6 | `config-setup.sql` | `config_tienda` (tienda + envíos) |
| 7 | `whatsapp-setup.sql` | `wa_flujos`, `wa_plantillas`, `wa_mensajes` (+ flujos semilla) |

> El orden importa: cada script se apoya en tablas/funciones de los anteriores.
> **Reportes** no necesita SQL (calcula sobre las tablas existentes).

### 3. Crear la cuenta de la dueña

Supabase → **Authentication → Users → Add user → Create new user**: escribe su
**correo** y **contraseña** y marca **Auto Confirm User**. (Cualquier cuenta
creada en el proyecto puede entrar; el acceso fino se controla por **rol**.)

### 4. Variables de entorno (local)

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 5. Correr en local

```bash
npm install
npm run dev
```

Abre <http://localhost:3000> y entra con la cuenta del paso 3.

### 6. Primeros pasos dentro del panel

1. **Configuración → "Hacerme Fundadora"**: te asigna el rol de administradora.
   (Arranque seguro: solo funciona mientras no exista ninguna Fundadora.)
2. **Productos → "Traer el catálogo del Organizador"**: primero *"Ver qué se
   copiaría"* (no escribe nada) y luego *"Aplicar migración"* para pasar tus
   bolsas, straps y combinaciones ya capturadas al catálogo nuevo. No borra nada.
3. Empieza a registrar **pedidos**, **clientas** y **movimientos de inventario**;
   el **Dashboard** y **Reportes** se llenan solos con esos datos.

---

## Desplegar en Vercel

1. Sube el proyecto a un repo de GitHub.
2. <https://vercel.com> → **Add New → Project** → importa el repo.
3. **Settings → Environment Variables**: agrega las **mismas tres** variables del
   `.env.local`. La `service_role` para todos los entornos y **nunca** con
   prefijo `NEXT_PUBLIC_`.
4. **Deploy** (Vercel detecta Next.js solo).
5. En Supabase → **Authentication → URL Configuration** agrega la URL de Vercel a
   *Site URL* / *Redirect URLs* para que el login funcione en producción.

---

## Estructura del proyecto

```text
taluna-organizador/
├── app/
│   ├── layout.js                # layout raíz (fuentes + tema claro/oscuro)
│   ├── globals.css              # tokens OKLCH (claro/oscuro) + base
│   ├── login/                   # pantalla de login
│   ├── (panel)/                 # el panel privado (todas las secciones)
│   │   ├── layout.js            # shell + requiere sesión
│   │   ├── page.js              # dashboard (Inicio)
│   │   ├── pedidos/  clientas/  whatsapp/
│   │   ├── productos/  categorias/  combinaciones/  inventario/
│   │   ├── reportes/  configuracion/
│   │   │   └── (page.js + actions.js por sección)
│   └── api/
│       ├── studio/…             # APIs del Organizador (estado + fotos)
│       └── catalog/migrate      # migración del Organizador -> tablas
├── components/panel/            # shell (Sidebar, Topbar…) + UI por dominio
├── lib/
│   ├── auth.js                  # sesión + roles (getPanelUser, requireFundadora…)
│   ├── catalog.js  inventario.js  ventas.js  reportes.js  config.js  whatsapp.js
│   └── supabase/                # clientes server / browser / admin(service_role)
├── public/estudio.html          # el Organizador original (sigue funcionando)
├── supabase/*.sql               # los 7 scripts de arriba
└── middleware.js                # protege todo: sin sesión -> /login
```

---

## Modelo de datos (resumen)

- **Catálogo**: `categorias`, `productos`, `producto_variantes` (nivel de stock),
  `producto_imagenes`, `combinaciones`.
- **Inventario**: `movimientos_inventario` (con signo); un trigger ajusta
  `producto_variantes.stock` y **nunca deja stock negativo**.
- **Ventas**: `clientas` (CRM), `pedidos` (folio por secuencia), `pedido_items`.
  Al **enviar** un pedido se insertan salidas de inventario (una sola vez).
- **Sistema**: `profiles` (roles), `config_tienda`, `wa_flujos` / `wa_plantillas`
  / `wa_mensajes`.
- **Organizador (legado)**: `studio_docs` (JSON) + bucket `studio` (fotos).

---

## Roles y seguridad

- **Roles**: `fundadora` (acceso total, edita Configuración y Equipo) y `staff`.
  La primera se asigna con **"Hacerme Fundadora"** o marcándola por SQL
  (bootstrap comentado en `roles-setup.sql`).
- Todas las tablas tienen **RLS activado**; el acceso pasa por el servidor con
  `service_role`, que **solo vive en el servidor** (`lib/supabase/admin.js`
  importa `server-only`: el build falla si se cuela al cliente).
- `middleware.js` exige sesión en toda la app.

---

## Pendientes / próximos pasos (no bloquean el uso)

- **WhatsApp Cloud API (Meta)**: hoy el envío es por enlace `wa.me` (gratis, sin
  aprobación). El envío automático con acuses de entrega/lectura requiere
  verificación de negocio y tiene costo; el modelo ya deja lugar (`canal = cloud_api`).
- **Pagos** (Stripe / Mercado Pago): pendiente; usar checkout hospedado.
- **Congelar el Organizador** (`public/estudio.html`) a solo-lectura una vez que
  valides que la migración cargó todo correctamente, para tener una sola fuente
  de verdad del catálogo.
