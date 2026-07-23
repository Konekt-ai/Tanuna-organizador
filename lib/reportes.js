import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { tipoDeCategoria } from '@/lib/catalog';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}
const num = (v) => Number(v) || 0;

function desdePara(rango, base) {
  const d = new Date(base);
  if (rango === 'hoy') return base.toISOString().slice(0, 10);
  if (rango === 'semana') {
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }
  if (rango === 'mes') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  return null;
}

export async function reporteCompleto(rango = 'mes', base = new Date()) {
  const db = createSupabaseAdmin();

  const { error: probe } = await db.from('orders').select('id').limit(1);
  if (probe && isMissingTable(probe)) return { ready: false };

  const desde = desdePara(rango, base);

  // 1) Pedidos en el rango.
  let pq = db.from('orders').select('id, total, payment_status, order_date, customer:customers(source)');
  if (desde) pq = pq.gte('order_date', desde);
  const { data: pedidos = [] } = await pq;

  const pagados = pedidos.filter((p) => p.payment_status === 'Pagado');
  const ventas = pagados.reduce((s, p) => s + num(p.total), 0);
  const porCobrar = pedidos.filter((p) => p.payment_status === 'Pendiente de pago').reduce((s, p) => s + num(p.total), 0);
  const kpis = {
    ventas,
    pedidos: pedidos.length,
    ticket: pagados.length ? Math.round(ventas / pagados.length) : 0,
    por_cobrar: porCobrar,
  };

  // 2) Ventas por día (últimos 7 días).
  const por_dia = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('es-MX', { weekday: 'short' });
    const monto = pagados.filter((p) => p.order_date === key).reduce((s, p) => s + num(p.total), 0);
    por_dia.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1, 3), monto });
  }

  // 3) Más vendidos y combinaciones.
  const ids = pedidos.map((p) => p.id);
  const bolsas = new Map();
  const straps = new Map();
  const combos = new Map();
  if (ids.length) {
    const { data: items = [] } = await db
      .from('order_items')
      .select('quantity, unit_price, order_id, variant:product_variants(product:products(name, category:categories(slug, name))), combination:combinations(color, bag:products!bag_product_id(name), strap:products!strap_product_id(name))')
      .in('order_id', ids);

    const add = (map, key, unidades, ingreso = 0) => {
      const cur = map.get(key) || { nombre: key, unidades: 0, ingreso: 0 };
      cur.unidades += unidades;
      cur.ingreso += ingreso;
      map.set(key, cur);
    };
    for (const it of items) {
      const cant = num(it.quantity);
      const prod = it.variant?.product;
      if (prod) {
        const tipo = tipoDeCategoria(prod.category?.slug, prod.category?.name);
        if (tipo === 'bolsa') add(bolsas, prod.name, cant, cant * num(it.unit_price));
        else if (tipo === 'strap') add(straps, prod.name, cant);
      }
      const c = it.combination;
      if (c) {
        if (c.bag?.name) add(bolsas, c.bag.name, cant, cant * num(it.unit_price));
        if (c.strap?.name) add(straps, c.strap.name, cant);
        const ck = `${c.bag?.name || '?'}||${c.color || ''}||${c.strap?.name || '?'}`;
        const cur = combos.get(ck) || { bolsa: c.bag?.name || '—', color: c.color || '—', strap: c.strap?.name || '—', elegidas: 0 };
        cur.elegidas += cant;
        combos.set(ck, cur);
      }
    }
  }
  const top = (map, n = 5) => [...map.values()].sort((a, b) => b.unidades - a.unidades).slice(0, n);
  const bolsas_top = top(bolsas);
  const straps_top = top(straps);
  const combos_top = [...combos.values()].sort((a, b) => b.elegidas - a.elegidas).slice(0, 5);

  // 4) Reponer.
  const { data: vars = [] } = await db.from('product_variants').select('id, stock, name, product:products(name)');
  const agotados = vars.filter((v) => v.stock <= 0);
  const bajo = vars.filter((v) => v.stock > 0 && v.stock <= 5);
  let sin_movimiento = 0;
  const hace60 = new Date(base);
  hace60.setDate(hace60.getDate() - 60);
  const { data: movs, error: movErr } = await db.from('inventory_movements').select('variant_id').gte('created_at', hace60.toISOString());
  if (!movErr) {
    const conMov = new Set((movs || []).map((m) => m.variant_id));
    sin_movimiento = vars.filter((v) => !conMov.has(v.id)).length;
  }
  const reponer = {
    agotados: agotados.map((v) => `${v.product?.name || 'Producto'} · ${v.name}`),
    bajo: bajo.map((v) => `${v.product?.name || 'Producto'} · ${v.name}`),
    sin_movimiento,
  };

  // 5) Canales.
  const canalMap = new Map();
  for (const p of pedidos) {
    const c = p.customer?.source || 'Sin origen';
    canalMap.set(c, (canalMap.get(c) || 0) + 1);
  }
  const totalCanales = [...canalMap.values()].reduce((s, n) => s + n, 0) || 1;
  const canales = [...canalMap.entries()]
    .map(([canal, numv]) => ({ canal, num: numv, pct: Math.round((numv / totalCanales) * 100) }))
    .sort((a, b) => b.num - a.num);

  return { ready: true, rango, kpis, por_dia, bolsas_top, straps_top, combos_top, reponer, canales };
}
