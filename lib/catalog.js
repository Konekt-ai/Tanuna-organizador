import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// Capa de datos del catálogo. Lee/escribe el esquema EXISTENTE en inglés
// (products, categories, product_variants, product_images) y devuelve a las
// pantallas objetos con claves en español. Las combinaciones viven en la tabla
// nueva `combinations`.

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

export function slugify(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n) || 0);
export { money };

const numOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const intOr0 = (v) => Math.max(0, Math.trunc(Number(v) || 0));

// El "tipo" (bolsa/strap/cinturón) se deriva de la categoría.
export function tipoDeCategoria(slug, name) {
  const s = `${slug || ''} ${name || ''}`.toLowerCase();
  if (s.includes('bolsa')) return 'bolsa';
  if (s.includes('strap')) return 'strap';
  if (s.includes('cintur')) return 'cinturon';
  return 'otro';
}

/* ------------------------------ Mapeadores ------------------------------- */
const mapVariante = (v) => ({
  id: v.id,
  color: v.name,
  color_hex: null,
  sku: v.sku,
  stock: v.stock,
  estado: v.stock <= 0 ? 'agotado' : v.is_active ? 'disponible' : 'oculto',
});
const mapImagen = (i) => ({ id: i.id, url: i.url, rol: i.alt, orden: i.position });
function mapProducto(p) {
  const cat = p.category || null;
  const variantes = (p.product_variants || []).map(mapVariante);
  const imgs = (p.product_images || []).map(mapImagen).sort((a, b) => a.orden - b.orden);
  return {
    id: p.id,
    tipo: tipoDeCategoria(cat?.slug, cat?.name),
    nombre: p.name,
    slug: p.slug,
    categoria_id: p.category_id,
    categoria: cat ? { id: cat.id, nombre: cat.name, slug: cat.slug } : null,
    descripcion_corta: p.short_desc,
    descripcion_larga: p.story,
    precio_base: p.price,
    estado: p.is_published ? 'publicado' : 'borrador',
    destacado: p.is_featured,
    medidas: p.dimensions,
    materiales: p.materials,
    producto_variantes: variantes,
    producto_imagenes: imgs,
    num_variantes: variantes.length,
    stock_total: variantes.reduce((s, v) => s + (v.stock || 0), 0),
    thumbnail: imgs[0]?.url ?? null,
  };
}

export async function catalogReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('products').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

/* ------------------------------- Categorías ------------------------------ */

export async function listCategorias() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('categories')
    .select('*, products(count)')
    .order('position', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((c) => ({
    id: c.id,
    nombre: c.name,
    slug: c.slug,
    orden: c.position,
    estado: c.is_active ? 'activo' : 'inactivo',
    num_productos: c.products?.[0]?.count ?? 0,
  }));
  return { ready: true, items };
}

export async function createCategoria({ nombre, slug, estado = 'activo' }) {
  const db = createSupabaseAdmin();
  const { data: maxRow } = await db.from('categories').select('position').order('position', { ascending: false }).limit(1).maybeSingle();
  const { error } = await db.from('categories').insert({
    name: nombre.trim(),
    slug: slug?.trim() || slugify(nombre),
    is_active: estado === 'activo',
    position: (maxRow?.position ?? 0) + 1,
  });
  if (error) throw error;
}

export async function updateCategoria(id, { nombre, slug, estado }) {
  const db = createSupabaseAdmin();
  const patch = {};
  if (nombre !== undefined) patch.name = nombre.trim();
  if (slug !== undefined) patch.slug = slug.trim() || slugify(nombre || '');
  if (estado !== undefined) patch.is_active = estado === 'activo';
  const { error } = await db.from('categories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCategoria(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('categories').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Productos ------------------------------ */

const PRODUCT_SELECT =
  '*, category:categories(id, name, slug), product_variants(*), product_images(id, url, alt, position)';

export async function listProductos() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('products').select(PRODUCT_SELECT).order('name');
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: (data || []).map(mapProducto) };
}

export async function getProducto(id) {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data ? mapProducto(data) : null;
}

function productoPatch(data) {
  const p = {};
  if (data.nombre !== undefined) p.name = data.nombre.trim();
  if (data.slug !== undefined) p.slug = data.slug.trim() || slugify(data.nombre || '');
  if (data.categoria_id !== undefined) p.category_id = data.categoria_id || null;
  if (data.descripcion_corta !== undefined) p.short_desc = data.descripcion_corta || null;
  if (data.descripcion_larga !== undefined) p.story = data.descripcion_larga || null;
  if (data.materiales !== undefined) p.materials = data.materiales || null;
  if (data.medidas !== undefined) p.dimensions = data.medidas || null;
  if (data.precio_base !== undefined) p.price = numOrNull(data.precio_base) ?? 0;
  if (data.estado !== undefined) p.is_published = data.estado === 'publicado';
  if (data.destacado !== undefined) p.is_featured = !!data.destacado;
  return p;
}

export async function createProducto(data) {
  const db = createSupabaseAdmin();
  const nombre = (data.nombre || '').trim();
  if (!nombre) throw new Error('El nombre es obligatorio.');
  const patch = productoPatch({ ...data, nombre });
  if (!patch.slug) patch.slug = slugify(nombre);
  if (patch.price === undefined) patch.price = 0;
  patch.currency = data.currency || 'MXN';
  const { data: dup } = await db.from('products').select('id').eq('slug', patch.slug).maybeSingle();
  if (dup) patch.slug = `${patch.slug}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: row, error } = await db.from('products').insert(patch).select('id').single();
  if (error) throw error;
  return row.id;
}

export async function updateProducto(id, data) {
  const db = createSupabaseAdmin();
  const patch = productoPatch(data);
  patch.updated_at = new Date().toISOString();
  const { error } = await db.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProducto(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Variantes ------------------------------ */

function variantePatch(data) {
  const p = {};
  if (data.color !== undefined) p.name = (data.color || '').trim() || 'Único';
  if (data.sku !== undefined) p.sku = data.sku || null;
  if (data.stock !== undefined) p.stock = intOr0(data.stock);
  if (data.estado !== undefined) p.is_active = data.estado !== 'oculto';
  return p;
}

export async function addVariante(productoId, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('product_variants').insert({ product_id: productoId, ...variantePatch(data) });
  if (error) throw error;
}

export async function updateVariante(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('product_variants').update(variantePatch(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteVariante(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Imágenes ------------------------------- */

export async function addImagen(productoId, { url, rol = null }) {
  const db = createSupabaseAdmin();
  if (!url) throw new Error('Falta la URL de la imagen.');
  const { data: maxRow } = await db.from('product_images').select('position').eq('product_id', productoId).order('position', { ascending: false }).limit(1).maybeSingle();
  const { error } = await db.from('product_images').insert({ product_id: productoId, url, alt: rol, position: (maxRow?.position ?? -1) + 1 });
  if (error) throw error;
}

export async function deleteImagen(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('product_images').delete().eq('id', id);
  if (error) throw error;
}

/* ----------------------------- Combinaciones ----------------------------- */

const mapCombo = (c) => ({
  id: c.id,
  bolsa_id: c.bag_product_id,
  strap_id: c.strap_product_id,
  color: c.color,
  largo: c.length,
  extra_strap: c.extra_price,
  precio_final: c.final_price,
  stock: c.stock,
  estado: c.is_active ? 'activo' : 'inactivo',
  lista_para_tienda: c.ready_for_store,
  bolsa: c.bag ? { nombre: c.bag.name } : null,
  strap: c.strap ? { nombre: c.strap.name } : null,
});

export async function listCombinaciones() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('combinations')
    .select('*, bag:products!bag_product_id(name), strap:products!strap_product_id(name)')
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: (data || []).map(mapCombo) };
}

function comboPatch(data) {
  const p = {};
  if (data.bolsa_id !== undefined) p.bag_product_id = data.bolsa_id || null;
  if (data.strap_id !== undefined) p.strap_product_id = data.strap_id || null;
  if (data.color !== undefined) p.color = data.color || null;
  if (data.largo !== undefined) p.length = data.largo || null;
  if (data.extra_strap !== undefined) p.extra_price = numOrNull(data.extra_strap) ?? 0;
  if (data.precio_final !== undefined) p.final_price = numOrNull(data.precio_final);
  if (data.stock !== undefined) p.stock = intOr0(data.stock);
  if (data.estado !== undefined) p.is_active = data.estado !== 'inactivo';
  if (data.lista_para_tienda !== undefined) p.ready_for_store = !!data.lista_para_tienda;
  return p;
}

export async function createCombinacion(data) {
  const db = createSupabaseAdmin();
  const patch = comboPatch(data);
  if (!patch.bag_product_id || !patch.strap_product_id) throw new Error('Elige bolsa y strap.');
  const { error } = await db.from('combinations').insert(patch);
  if (error) throw error;
}

export async function updateCombinacion(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('combinations').update(comboPatch(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteCombinacion(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('combinations').delete().eq('id', id);
  if (error) throw error;
}

// Productos por tipo (derivado de la categoría), para selects.
export async function listProductosSimple(tipo) {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('products').select('id, name, category:categories(slug, name)').order('name');
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data || [])
    .map((p) => ({ id: p.id, nombre: p.name, tipo: tipoDeCategoria(p.category?.slug, p.category?.name) }))
    .filter((p) => !tipo || p.tipo === tipo);
}

export async function catalogCounts() {
  const db = createSupabaseAdmin();
  const [prod, comb] = await Promise.all([
    db.from('products').select('category:categories(slug, name)'),
    db.from('combinations').select('id'),
  ]);
  if (prod.error && isMissingTable(prod.error)) return null;
  const tipos = (prod.data || []).map((p) => tipoDeCategoria(p.category?.slug, p.category?.name));
  return {
    bolsas: tipos.filter((t) => t === 'bolsa').length,
    straps: tipos.filter((t) => t === 'strap').length,
    cinturones: tipos.filter((t) => t === 'cinturon').length,
    combinaciones: (comb.data || []).length,
  };
}
