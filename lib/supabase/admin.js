import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente con la SERVICE_ROLE_KEY: salta RLS y puede escribir todo.
// ⚠️ SOLO servidor. El import 'server-only' hace que el build falle si
// alguien intenta usarlo en un componente de cliente. NUNCA exponer esta llave.
export function createSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY. Agrégala en .env.local (solo servidor).'
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
