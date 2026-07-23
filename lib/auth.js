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
      .select('id, name, initials, role, avatar_color, is_active')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    // Mapea al shape en español que consume el resto de la app.
    return {
      id: data.id,
      nombre: data.name,
      iniciales: data.initials,
      rol: data.role,
      avatar_color: data.avatar_color,
      activo: data.is_active,
    };
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

// ¿La cuenta activa es fundadora? (booleano, no redirige).
export async function esFundadora() {
  const profile = await getProfile();
  return profile?.rol === 'fundadora' && profile?.activo !== false;
}

// Exige rol de fundadora. Úsalo en Server Actions sensibles (Configuración /
// Equipo). Lanza error si no lo es (para devolverlo al cliente).
export async function requireFundadora() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!profile || profile.rol !== 'fundadora' || profile.activo === false) {
    throw new Error('Solo la fundadora puede hacer este cambio.');
  }
  return { user, profile };
}
