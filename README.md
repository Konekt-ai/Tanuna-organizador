# Taluna · Organizador

App web **móvil e interna** para que la dueña de **Taluna MX** organice su
catálogo (bolsas, straps, cinturones, compatibilidades y combinaciones) y suba
fotos desde el celular. **No es la tienda**: es una herramienta de staging para
dejar todo ordenado antes de pasarlo a la tienda real.

Todo se guarda **en la nube** (Supabase) detrás de un **login**, con respaldo
local automático: si no hay conexión, sigue funcionando en el equipo y reintenta
subir cuando vuelve la señal.

---

## Stack

- **Next.js 14** (App Router) + **React** + **Tailwind CSS**
- **Supabase**: Auth (correo + contraseña), Postgres y Storage
- Las **escrituras** se hacen en el servidor con la llave `service_role`
  (rutas API), igual de seguro que un panel admin
- Desplegable en **Vercel**. UI 100 % en español, mobile-first

---

## Cómo está armado

La interfaz completa del Organizador es un solo archivo estático,
`public/estudio.html` (el prototipo, ya conectado a la nube). Next.js le pone
alrededor el **login**, la **protección de rutas** y las **APIs** que guardan en
Supabase.

```text
taluna-organizador/
├── app/
│   ├── layout.js                # layout raíz (fuentes Fraunces + Manrope)
│   ├── globals.css              # Tailwind + estilos base
│   ├── page.js                  # panel de inicio (abre el Organizador)
│   ├── actions.js               # server action: cerrar sesión
│   ├── login/
│   │   ├── page.js              # pantalla de login
│   │   └── login-form.js        # formulario (client) correo + contraseña
│   └── api/
│       └── studio/
│           ├── state/route.js   # GET/PUT del documento JSON (studio_docs)
│           └── image/route.js   # POST/DELETE de fotos (bucket "studio")
├── components/
│   └── TalunaGlyph.js           # glifo de marca
├── lib/
│   ├── auth.js                  # getUser() / requireUser()
│   └── supabase/
│       ├── server.js            # cliente ligado a cookies (sabe quién entra)
│       ├── browser.js           # cliente del navegador (login)
│       └── admin.js             # cliente service_role (solo servidor)
├── public/
│   └── estudio.html             # el Organizador completo (UI + lógica)
├── supabase/
│   └── studio-setup.sql         # se corre 1 vez: tabla + trigger + bucket
├── middleware.js                # protege todo: sin sesión -> /login
├── .env.example                 # plantilla de variables
└── package.json
```

### Datos (tipo documento)

- Todo el estado (bolsas, straps, cinturones, compatibilidades, combinaciones,
  metadatos) vive como **un documento JSON** en la tabla
  `studio_docs (id text pk, data jsonb, updated_at)` — fila con `id = 'main'`.
- Las **fotos** van al bucket de Storage **`studio`** (público de lectura) y en
  el JSON solo se guardan las **URLs**.
- Rutas API (todas validan la sesión con `getUser` y escriben con `service_role`):
  - `GET /api/studio/state` — leer el JSON
  - `PUT /api/studio/state` — guardar el JSON
  - `POST /api/studio/image` — subir una foto
  - `DELETE /api/studio/image` — borrar una foto

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com> → **New project**.
2. Cuando esté listo, ve a **Project Settings → API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Crear la tabla y el bucket

En Supabase → **SQL Editor → New query**, pega el contenido de
[`supabase/studio-setup.sql`](supabase/studio-setup.sql) y dale **Run**. Esto
crea la tabla `studio_docs` (con RLS cerrada y trigger de `updated_at`) y el
bucket `studio` (público de lectura). Es seguro correrlo más de una vez.

### 3. Crear la cuenta de la dueña

En Supabase → **Authentication → Users → Add user → Create new user**:

- escribe su **correo** y una **contraseña**,
- marca **Auto Confirm User** (para que pueda entrar sin verificar correo).

Con eso ya puede iniciar sesión. (Por defecto cualquier cuenta creada en este
proyecto puede entrar. Para limitar a **un solo correo**, define `ADMIN_EMAIL`
en el entorno y descomenta el bloque correspondiente en `lib/auth.js`.)

### 4. Variables de entorno (local)

Copia la plantilla y rellénala:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 5. Correr local

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Te mandará a `/login`; entra con la cuenta del
paso 3 y toca **Abrir el Organizador**.

---

## Desplegar en Vercel

1. Sube el proyecto a un repo de GitHub.
2. En <https://vercel.com> → **Add New → Project** → importa el repo.
3. En **Settings → Environment Variables** agrega las **mismas tres** variables
   del `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`). Marca la `service_role` para todos los entornos;
   **nunca** la pongas con prefijo `NEXT_PUBLIC_`.
4. **Deploy**. Vercel detecta Next.js automáticamente.

> Tip: en Supabase → **Authentication → URL Configuration** agrega la URL de
> Vercel a *Site URL* / *Redirect URLs* para que el login funcione en producción.

---

## Indicador de guardado

Arriba a la derecha del Organizador verás el estado en vivo:

| Texto | Qué significa |
|---|---|
| **Guardando…** | Mandando cambios a la nube |
| **Guardado ✓ en la nube** | Todo respaldado en Supabase |
| **Sin conexión · guardado en este equipo** | Trabajando local; reintenta solo |
| **Inicia sesión para guardar** | Caducó la sesión → vuelve a entrar |

---

## Notas de seguridad

- `studio_docs` tiene **RLS activado y sin políticas**: nadie anónimo la lee ni
  escribe. Solo el servidor (con `service_role`, que salta RLS) puede tocarla.
- La llave `service_role` vive **solo en el servidor** (`lib/supabase/admin.js`
  importa `server-only`: el build falla si se cuela al cliente).
- El `middleware.js` exige sesión en toda la app y en `/api/studio/*`.
- El bucket `studio` es público **de lectura** (las fotos se ven con su URL);
  subir y borrar solo ocurre por las APIs autenticadas.
