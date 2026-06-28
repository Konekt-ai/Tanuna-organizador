'use client';
import { createBrowserClient } from '@supabase/ssr';

// Cliente de Supabase para el NAVEGADOR (llave anon). Guarda la sesión en
// cookies que el middleware y las APIs del servidor pueden leer. Se usa en la
// pantalla de login para iniciar sesión con correo + contraseña.
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
