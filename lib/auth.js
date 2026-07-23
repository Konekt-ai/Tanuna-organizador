import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

// Devuelve el usuario logueado o null. No redirige.
// NOTA: cualquier cuenta creada en Supabase puede entrar al panel (así el
// cliente no tiene problemas). La autorización FINA se hace por rol con
// getProfile()/requireFundadora() en las zonas sensibles (Configuración, Equipo).
export async function getUser() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

// Para usar al inicio de páginas y Server Actions protegidas.
// Si no hay sesión válida, manda al login.
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

// Perfil (nombre, iniciales, rol) de la cuenta activa. Tolerante: si la tabla
// profiles aún no existe (no se ha corrido roles-setup.sql), devuelve null y el
// panel sigue funcionando con datos derivados del correo.
export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, iniciales, rol, avatar_color, activo')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// Combina usuario + perfil en el objeto que consume el shell del panel.
export async function getPanelUser() {
  const user = await requireUser();
  const profile = await getProfile();
  const fallbackNombre = user.email ? user.email.split('@')[0] : 'Cuenta';
  return {
    id: user.id,
    email: user.email,
    nombre: profile?.nombre?.trim() || fallbackNombre,
    rol: profile?.rol ?? null,
    iniciales:
      profile?.iniciales?.trim() ||
      (profile?.nombre || fallbackNombre).slice(0, 2).toUpperCase(),
    avatarColor: profile?.avatar_color || 'oklch(0.62 0.14 40)',
  };
}

// Exige rol de fundadora. Úsalo en Configuración/Equipo (Fase 5). Si no hay
// perfil de fundadora, redirige al inicio del panel.
export async function requireFundadora() {
  const profile = await getProfile();
  if (!profile || profile.rol !== 'fundadora') redirect('/');
  return profile;
}
