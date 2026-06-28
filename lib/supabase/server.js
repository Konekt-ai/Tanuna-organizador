import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de Supabase para el SERVIDOR, ligado a las cookies de la petición.
// Mantiene la sesión del admin (llave anon). Se usa para SABER QUIÉN está
// logueado, no para escribir con privilegios (eso lo hace lib/supabase/admin.js).
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component (donde no se pueden escribir
            // cookies). El middleware se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
