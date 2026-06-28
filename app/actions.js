'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

// Cierra la sesión (borra las cookies de Supabase) y manda al login.
// Es un Server Action: se puede usar directo como `action` de un <form>.
export async function signOut() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
