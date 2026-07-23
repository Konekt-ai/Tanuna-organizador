import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

/* ---------------------------- Config de tienda --------------------------- */

export async function getConfigTienda() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('store_config').select('*').eq('id', 'main').maybeSingle();
  if (error) {
    if (isMissingTable(error)) return { ready: false, config: null };
    throw error;
  }
  const config = data
    ? {
        nombre_tienda: data.store_name,
        moneda: data.currency,
        meta_mensual: data.monthly_goal,
        telefono: data.phone,
        correo: data.email,
        whatsapp_numero: data.whatsapp_number,
        instagram: data.instagram,
        direccion: data.address,
        envios: data.shipping || {},
        pagos: data.payments || {},
      }
    : null;
  return { ready: true, config };
}

export async function updateConfigTienda(patch) {
  const db = createSupabaseAdmin();
  const p = {};
  if (patch.nombre_tienda !== undefined) p.store_name = patch.nombre_tienda || 'Taluna MX';
  if (patch.moneda !== undefined) p.currency = patch.moneda || 'MXN';
  if (patch.telefono !== undefined) p.phone = patch.telefono || null;
  if (patch.correo !== undefined) p.email = patch.correo || null;
  if (patch.whatsapp_numero !== undefined) p.whatsapp_number = patch.whatsapp_numero || null;
  if (patch.instagram !== undefined) p.instagram = patch.instagram || null;
  if (patch.direccion !== undefined) p.address = patch.direccion || null;
  if (patch.meta_mensual !== undefined) p.monthly_goal = Number(patch.meta_mensual) || 0;
  if (patch.envios !== undefined) p.shipping = patch.envios;
  if (patch.pagos !== undefined) p.payments = patch.pagos;
  const { error } = await db.from('store_config').upsert({ id: 'main', ...p }, { onConflict: 'id' });
  if (error) throw error;
}

/* -------------------------------- Equipo --------------------------------- */

export async function listEquipo() {
  const db = createSupabaseAdmin();
  const { data: perfiles, error } = await db
    .from('profiles')
    .select('id, name, initials, role, is_active, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const emails = {};
  try {
    const { data } = await db.auth.admin.listUsers();
    for (const u of data?.users || []) emails[u.id] = u.email;
  } catch {
    /* sin admin API: se omiten correos */
  }
  const items = (perfiles || []).map((p) => ({
    id: p.id,
    nombre: p.name,
    iniciales: p.initials,
    rol: p.role,
    activo: p.is_active,
    email: emails[p.id] || null,
  }));
  return { ready: true, items };
}

export async function contarFundadoras() {
  const db = createSupabaseAdmin();
  const { count, error } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'fundadora').eq('is_active', true);
  if (error) return 0;
  return count ?? 0;
}

export async function updateProfileRol(id, rol) {
  if (!['fundadora', 'staff'].includes(rol)) throw new Error('Rol inválido.');
  const db = createSupabaseAdmin();
  const { error } = await db.from('profiles').update({ role: rol }).eq('id', id);
  if (error) throw error;
}

export async function toggleProfileActivo(id, activo) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('profiles').update({ is_active: !!activo }).eq('id', id);
  if (error) throw error;
}

export async function reclamarFundadora(userId) {
  const db = createSupabaseAdmin();
  const n = await contarFundadoras();
  if (n > 0) throw new Error('Ya existe una fundadora. Pídele a ella que te asigne el rol.');
  const { error } = await db.from('profiles').update({ role: 'fundadora' }).eq('id', userId);
  if (error) throw error;
}
