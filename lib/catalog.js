import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// Capa de datos del catálogo. Escribe/lee con service_role (salta RLS); la
// autorización se hace en las Server Actions/rutas que la invocan.

// ¿El error es "la tabla no existe" (aún no se corrió catalog-setup.sql)?
function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

export function slugify(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const money = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export { money };

// ¿Ya existe el esquema del catálogo? (para mostrar estado "corre el SQL")
export async function catalogReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('categorias').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

/* ------------------------------- Categorías ------------------------------ */

export async function listCategorias() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('categorias')
    .select('*, productos(count)')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((c) => ({
    ...c,
    num_productos: c.productos?.[0]?.count ?? 0,
  }));
  return { ready: true, items };
}

export async function createCategoria({ nombre, slug, estado = 'activo' }) {
  const db = createSupabaseAdmin();
  const { data: maxRow } = await db
    .from('categorias')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();
  const orden = (maxRow?.orden ?? 0) + 1;
  const { error } = await db.from('categorias').insert({
    nombre: nombre.trim(),
    slug: slug?.trim() || slugify(nombre),
    estado,
    orden,
  });
  if (error) throw error;
}

export async function updateCategoria(id, { nombre, slug, estado }) {
  const db = createSupabaseAdmin();
  const patch = {};
  if (nombre !== undefined) patch.nombre = nombre.trim();
  if (slug !== undefined) patch.slug = slug.trim() || slugify(nombre || '');
  if (estado !== undefined) patch.estado = estado;
  const { error } = await db.from('categorias').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCategoria(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('categorias').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Productos ------------------------------ */

export async function listProductos({ tipo, estado, search } = {}) {
  const db = createSupabaseAdmin();
  let q = db
    .from('productos')
    .select(
      '*, categoria:categorias(nombre), producto_variantes(id, stock), producto_imagenes(url, orden)'
    )
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });
  if (tipo) q = q.eq('tipo', tipo);
  if (estado) q = q.eq('estado', estado);
  if (search) q = q.ilike('nombre', `%${search}%`);

  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((p) => {
    const variantes = p.producto_variantes || [];
    const imgs = (p.producto_imagenes || []).sort((a, b) => a.orden - b.orden);
    return {
      ...p,
      num_variantes: variantes.length,
      stock_total: variantes.reduce((s, v) => s + (v.stock || 0), 0),
      thumbnail: imgs[0]?.url ?? null,
    };
  });
  return { ready: true, items };
}

export async function getProducto(id) {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('productos')
    .select(
      '*, categoria:categorias(id, nombre), producto_variantes(*), producto_imagenes(*)'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data;
}

const numOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const intOr0 = (v) => Math.max(0, Math.trunc(Number(v) || 0));

function productoPatch(data) {
  const patch = {};
  if (data.tipo !== undefined) patch.tipo = data.tipo;
  if (data.nombre !== undefined) patch.nombre = data.nombre.trim();
  if (data.slug !== undefined) patch.slug = data.slug.trim() || slugify(data.nombre || '');
  if (data.categoria_id !== undefined) patch.categoria_id = data.categoria_id || null;
  if (data.descripcion_corta !== undefined) patch.descripcion_corta = data.descripcion_corta || null;
  if (data.descripcion_larga !== undefined) patch.descripcion_larga = data.descripcion_larga || null;
  if (data.precio_base !== undefined) patch.precio_base = numOrNull(data.precio_base) ?? 0;
  if (data.estado !== undefined) patch.estado = data.estado;
  if (data.destacado !== undefined) patch.destacado = !!data.destacado;
  if (data.dim_alto !== undefined) patch.dim_alto = numOrNull(data.dim_alto);
  if (data.dim_ancho !== undefined) patch.dim_ancho = numOrNull(data.dim_ancho);
  if (data.dim_largo !== undefined) patch.dim_largo = numOrNull(data.dim_largo);
  if (data.materiales !== undefined) patch.materiales = data.materiales || null;
  if (data.cuidados !== undefined) patch.cuidados = data.cuidados || null;
  return patch;
}

export async function createProducto(data) {
  const db = createSupabaseAdmin();
  const nombre = (data.nombre || '').trim();
  if (!nombre) throw new Error('El nombre es obligatorio.');
  const patch = productoPatch({ ...data, nombre });
  if (!patch.slug) patch.slug = slugify(nombre);
  // Evita choque de slug: si existe, agrega sufijo corto.
  const { data: dup } = await db.from('productos').select('id').eq('slug', patch.slug).maybeSingle();
  if (dup) patch.slug = `${patch.slug}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: row, error } = await db.from('productos').insert(patch).select('id').single();
  if (error) throw error;
  return row.id;
}

export async function updateProducto(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('productos').update(productoPatch(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteProducto(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('productos').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Variantes ------------------------------ */

function variantePatch(data) {
  const patch = {};
  if (data.color !== undefined) patch.color = (data.color || '').trim() || 'Único';
  if (data.color_hex !== undefined) patch.color_hex = data.color_hex || null;
  if (data.sku !== undefined) patch.sku = data.sku || null;
  if (data.stock !== undefined) patch.stock = intOr0(data.stock);
  if (data.estado !== undefined) patch.estado = data.estado;
  return patch;
}

export async function addVariante(productoId, data) {
  const db = createSupabaseAdmin();
  const { error } = await db
    .from('producto_variantes')
    .insert({ producto_id: productoId, ...variantePatch(data) });
  if (error) throw error;
}

export async function updateVariante(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('producto_variantes').update(variantePatch(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteVariante(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('producto_variantes').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Imágenes ------------------------------- */

export async function addImagen(productoId, { url, rol = null, variante_id = null }) {
  const db = createSupabaseAdmin();
  if (!url) throw new Error('Falta la URL de la imagen.');
  const { data: maxRow } = await db
    .from('producto_imagenes')
    .select('orden')
    .eq('producto_id', productoId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();
  const orden = (maxRow?.orden ?? -1) + 1;
  const { error } = await db
    .from('producto_imagenes')
    .insert({ producto_id: productoId, url, rol, variante_id, orden });
  if (error) throw error;
}

export async function deleteImagen(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('producto_imagenes').delete().eq('id', id);
  if (error) throw error;
}

/* ----------------------------- Combinaciones ----------------------------- */

export async function listCombinaciones() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('combinaciones')
    .select('*, bolsa:productos!bolsa_id(nombre), strap:productos!strap_id(nombre)')
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: data || [] };
}

function combinacionPatch(data) {
  const patch = {};
  if (data.bolsa_id !== undefined) patch.bolsa_id = data.bolsa_id || null;
  if (data.strap_id !== undefined) patch.strap_id = data.strap_id || null;
  if (data.color !== undefined) patch.color = data.color || null;
  if (data.largo !== undefined) patch.largo = data.largo || null;
  if (data.extra_strap !== undefined) patch.extra_strap = numOrNull(data.extra_strap) ?? 0;
  if (data.precio_final !== undefined) patch.precio_final = numOrNull(data.precio_final);
  if (data.stock !== undefined) patch.stock = intOr0(data.stock);
  if (data.estado !== undefined) patch.estado = data.estado;
  if (data.lista_para_tienda !== undefined) patch.lista_para_tienda = !!data.lista_para_tienda;
  return patch;
}

export async function createCombinacion(data) {
  const db = createSupabaseAdmin();
  const patch = combinacionPatch(data);
  if (!patch.bolsa_id || !patch.strap_id) throw new Error('Elige bolsa y strap.');
  const { error } = await db.from('combinaciones').insert(patch);
  if (error) throw error;
}

export async function updateCombinacion(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('combinaciones').update(combinacionPatch(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteCombinacion(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('combinaciones').delete().eq('id', id);
  if (error) throw error;
}

// Lista corta de productos por tipo, para selects (combinaciones, movimientos).
export async function listProductosSimple(tipo) {
  const db = createSupabaseAdmin();
  let q = db.from('productos').select('id, nombre, tipo').order('nombre');
  if (tipo) q = q.eq('tipo', tipo);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data || [];
}

// Conteos para KPIs (bolsas, straps, cinturones, combinaciones).
export async function catalogCounts() {
  const db = createSupabaseAdmin();
  const [prod, comb] = await Promise.all([
    db.from('productos').select('tipo'),
    db.from('combinaciones').select('id'),
  ]);
  if (prod.error && isMissingTable(prod.error)) return null;
  const tipos = prod.data || [];
  return {
    bolsas: tipos.filter((p) => p.tipo === 'bolsa').length,
    straps: tipos.filter((p) => p.tipo === 'strap').length,
    cinturones: tipos.filter((p) => p.tipo === 'cinturon').length,
    combinaciones: (comb.data || []).length,
  };
}
