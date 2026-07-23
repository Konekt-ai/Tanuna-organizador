import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

const BAJO_STOCK = 5; // umbral de "quedan pocas"

// ¿Existe la tabla de movimientos? (para el estado "corre el SQL").
export async function inventarioReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('movimientos_inventario').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

// Productos con sus variantes y stock, para la tabla de inventario.
export async function listInventario() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('productos')
    .select('id, nombre, tipo, slug, precio_base, categoria:categorias(nombre), producto_variantes(id, color, sku, stock, estado)')
    .order('nombre');
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((p) => {
    const variantes = p.producto_variantes || [];
    const piezas = variantes.reduce((s, v) => s + (v.stock || 0), 0);
    return { ...p, piezas, num_variantes: variantes.length };
  });
  return { ready: true, items };
}

// KPIs del inventario.
export async function inventarioKpis() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('producto_variantes')
    .select('stock, producto:productos(precio_base)');
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  const rows = data || [];
  return {
    piezas_totales: rows.reduce((s, v) => s + (v.stock || 0), 0),
    valor_inventario: rows.reduce((s, v) => s + (v.stock || 0) * (Number(v.producto?.precio_base) || 0), 0),
    bajo_stock: rows.filter((v) => v.stock > 0 && v.stock <= BAJO_STOCK).length,
    agotados: rows.filter((v) => (v.stock || 0) <= 0).length,
  };
}

// Variantes en formato plano, para el selector de "registrar movimiento".
export async function listVariantesParaMover() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('producto_variantes')
    .select('id, color, stock, producto:productos(nombre, tipo)')
    .order('color');
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data || []).map((v) => ({
    id: v.id,
    color: v.color,
    stock: v.stock,
    producto: v.producto?.nombre || '',
    label: `${v.producto?.nombre || 'Producto'} · ${v.color}`,
  }));
}

// Movimientos recientes (con producto y variante resueltos).
export async function listMovimientos({ limit = 30 } = {}) {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('movimientos_inventario')
    .select('*, variante:producto_variantes(color, producto:productos(nombre))')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((m) => ({
    ...m,
    producto: m.variante?.producto?.nombre || '—',
    color: m.variante?.color || '',
  }));
  return { ready: true, items };
}

// Registra un movimiento (el trigger de la BD ajusta el stock).
export async function createMovimiento({ variante_id, delta, tipo, motivo, nota, usuario_id }) {
  const db = createSupabaseAdmin();
  if (!variante_id) throw new Error('Elige la variante.');
  if (!delta || Number(delta) === 0) throw new Error('La cantidad no puede ser cero.');
  const { error } = await db.from('movimientos_inventario').insert({
    variante_id,
    delta: Math.trunc(Number(delta)),
    tipo,
    motivo: motivo || null,
    nota: nota || null,
    usuario_id: usuario_id || null,
  });
  if (error) throw error;
}
