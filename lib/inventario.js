import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { tipoDeCategoria } from '@/lib/catalog';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}
const BAJO_STOCK = 5;

const mapVarStock = (v) => ({
  id: v.id,
  color: v.name,
  sku: v.sku,
  stock: v.stock,
  estado: v.stock <= 0 ? 'agotado' : v.is_active ? 'disponible' : 'oculto',
});

export async function inventarioReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('inventory_movements').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

export async function listInventario() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('products')
    .select('id, name, slug, price, category:categories(name, slug), product_variants(id, name, sku, stock, is_active)')
    .order('name');
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((p) => {
    const variantes = (p.product_variants || []).map(mapVarStock);
    return {
      id: p.id,
      nombre: p.name,
      slug: p.slug,
      tipo: tipoDeCategoria(p.category?.slug, p.category?.name),
      precio_base: p.price,
      categoria: p.category ? { nombre: p.category.name } : null,
      producto_variantes: variantes,
      num_variantes: variantes.length,
      piezas: variantes.reduce((s, v) => s + (v.stock || 0), 0),
    };
  });
  return { ready: true, items };
}

export async function inventarioKpis() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('product_variants').select('stock, is_active, product:products(price)');
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  const rows = data || [];
  return {
    piezas_totales: rows.reduce((s, v) => s + (v.stock || 0), 0),
    valor_inventario: rows.reduce((s, v) => s + (v.stock || 0) * (Number(v.product?.price) || 0), 0),
    bajo_stock: rows.filter((v) => v.stock > 0 && v.stock <= BAJO_STOCK).length,
    agotados: rows.filter((v) => (v.stock || 0) <= 0).length,
  };
}

export async function listVariantesParaMover() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('product_variants').select('id, name, stock, product:products(name)').order('name');
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data || []).map((v) => ({
    id: v.id,
    color: v.name,
    stock: v.stock,
    producto: v.product?.name || '',
    label: `${v.product?.name || 'Producto'} · ${v.name}`,
  }));
}

export async function listMovimientos({ limit = 30 } = {}) {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('inventory_movements')
    .select('*, variant:product_variants(name, product:products(name))')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((m) => ({
    id: m.id,
    created_at: m.created_at,
    tipo: m.type,
    delta: m.delta,
    motivo: m.reason,
    producto: m.variant?.product?.name || '—',
    color: m.variant?.name || '',
  }));
  return { ready: true, items };
}

export async function createMovimiento({ variante_id, delta, tipo, motivo, nota, usuario_id }) {
  const db = createSupabaseAdmin();
  if (!variante_id) throw new Error('Elige la variante.');
  if (!delta || Number(delta) === 0) throw new Error('La cantidad no puede ser cero.');
  const { error } = await db.from('inventory_movements').insert({
    variant_id: variante_id,
    delta: Math.trunc(Number(delta)),
    type: tipo,
    reason: motivo || null,
    note: nota || null,
    user_id: usuario_id || null,
  });
  if (error) throw error;
}
