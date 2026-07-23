import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

/* ---------------------------- Config de tienda --------------------------- */

export async function getConfigTienda() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('config_tienda').select('*').eq('id', 'main').maybeSingle();
  if (error) {
    if (isMissingTable(error)) return { ready: false, config: null };
    throw error;
  }
  return { ready: true, config: data };
}

export async function updateConfigTienda(patch) {
  const db = createSupabaseAdmin();
  const p = {};
  for (const k of ['nombre_tienda', 'moneda', 'telefono', 'correo', 'whatsapp_numero', 'instagram', 'direccion']) {
    if (patch[k] !== undefined) p[k] = patch[k] || null;
  }
  if (patch.meta_mensual !== undefined) p.meta_mensual = Number(patch.meta_mensual) || 0;
  if (patch.envios !== undefined) p.envios = patch.envios;
  if (patch.pagos !== undefined) p.pagos = patch.pagos;
  const { error } = await db
    .from('config_tienda')
    .upsert({ id: 'main', ...p }, { onConflict: 'id' });
  if (error) throw error;
}

/* -------------------------------- Equipo --------------------------------- */

// Lista el equipo: perfiles (rol/activo) + correo desde auth.users.
export async function listEquipo() {
  const db = createSupabaseAdmin();
  const { data: perfiles, error } = await db
    .from('profiles')
    .select('id, nombre, iniciales, rol, activo, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  // Correos desde el Admin API de Auth.
  const emails = {};
  try {
    const { data } = await db.auth.admin.listUsers();
    for (const u of data?.users || []) emails[u.id] = u.email;
  } catch {
    /* sin permisos de admin API: se omiten los correos */
  }
  const items = (perfiles || []).map((p) => ({ ...p, email: emails[p.id] || null }));
  return { ready: true, items };
}

export async function contarFundadoras() {
  const db = createSupabaseAdmin();
  const { count, error } = await db
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'fundadora')
    .eq('activo', true);
  if (error) return 0;
  return count ?? 0;
}

export async function updateProfileRol(id, rol) {
  if (!['fundadora', 'staff'].includes(rol)) throw new Error('Rol inválido.');
  const db = createSupabaseAdmin();
  const { error } = await db.from('profiles').update({ rol }).eq('id', id);
  if (error) throw error;
}

export async function toggleProfileActivo(id, activo) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('profiles').update({ activo: !!activo }).eq('id', id);
  if (error) throw error;
}

// Arranque seguro: promueve a la persona actual a fundadora SOLO si todavía no
// existe ninguna. Una vez que hay una fundadora, deja de funcionar.
export async function reclamarFundadora(userId) {
  const db = createSupabaseAdmin();
  const n = await contarFundadoras();
  if (n > 0) throw new Error('Ya existe una fundadora. Pídele a ella que te asigne el rol.');
  const { error } = await db.from('profiles').update({ rol: 'fundadora' }).eq('id', userId);
  if (error) throw error;
}
