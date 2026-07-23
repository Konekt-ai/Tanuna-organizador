import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

const num = (v) => Number(v) || 0;

// Convierte un rango en una fecha "desde" (YYYY-MM-DD) o null (todo).
// hoy=`base`; semana=últimos 7 días; mes=inicio del mes actual.
function desdePara(rango, base) {
  const d = new Date(base);
  if (rango === 'hoy') return base.toISOString().slice(0, 10);
  if (rango === 'semana') {
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }
  if (rango === 'mes') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return null; // todo
}

// Reporte completo. `base` es la fecha "hoy" (se pasa desde el server component,
// nunca se usa Date.now dentro de una función pura reutilizable en workflows).
export async function reporteCompleto(rango = 'mes', base = new Date()) {
  const db = createSupabaseAdmin();

  // ¿Existe la capa de ventas?
  const { error: probe } = await db.from('pedidos').select('id').limit(1);
  if (probe && isMissingTable(probe)) return { ready: false };

  const desde = desdePara(rango, base);

  // 1) Pedidos (con canal de la clienta) en el rango.
  let pq = db.from('pedidos').select('id, total, estado_pago, fecha, clienta:clientas(canal_origen)');
  if (desde) pq = pq.gte('fecha', desde);
  const { data: pedidos = [] } = await pq;

  const pagados = pedidos.filter((p) => p.estado_pago === 'Pagado');
  const ventas = pagados.reduce((s, p) => s + num(p.total), 0);
  const porCobrar = pedidos.filter((p) => p.estado_pago === 'Pendiente de pago').reduce((s, p) => s + num(p.total), 0);
  const kpis = {
    ventas,
    pedidos: pedidos.length,
    ticket: pagados.length ? Math.round(ventas / pagados.length) : 0,
    por_cobrar: porCobrar,
  };

  // 2) Ventas por día (últimos 7 días, sobre pedidos pagados).
  const por_dia = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('es-MX', { weekday: 'short' });
    const monto = pagados.filter((p) => p.fecha === key).reduce((s, p) => s + num(p.total), 0);
    por_dia.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1, 3), monto });
  }

  // 3) Más vendidos y combinaciones (desde las líneas de los pedidos del rango).
  const ids = pedidos.map((p) => p.id);
  const bolsas = new Map();
  const straps = new Map();
  const combos = new Map();
  if (ids.length) {
    const { data: items = [] } = await db
      .from('pedido_items')
      .select(
        'cantidad, precio_unitario, pedido_id, variante:producto_variantes(producto:productos(id, nombre, tipo)), combinacion:combinaciones(color, bolsa:productos!bolsa_id(nombre), strap:productos!strap_id(nombre))'
      )
      .in('pedido_id', ids);

    const add = (map, key, unidades, ingreso = 0) => {
      const cur = map.get(key) || { nombre: key, unidades: 0, ingreso: 0 };
      cur.unidades += unidades;
      cur.ingreso += ingreso;
      map.set(key, cur);
    };

    for (const it of items) {
      const cant = num(it.cantidad);
      const prod = it.variante?.producto;
      if (prod) {
        if (prod.tipo === 'bolsa') add(bolsas, prod.nombre, cant, cant * num(it.precio_unitario));
        else if (prod.tipo === 'strap') add(straps, prod.nombre, cant);
      }
      const c = it.combinacion;
      if (c) {
        if (c.bolsa?.nombre) add(bolsas, c.bolsa.nombre, cant, cant * num(it.precio_unitario));
        if (c.strap?.nombre) add(straps, c.strap.nombre, cant);
        const ck = `${c.bolsa?.nombre || '?'}||${c.color || ''}||${c.strap?.nombre || '?'}`;
        const cur = combos.get(ck) || { bolsa: c.bolsa?.nombre || '—', color: c.color || '—', strap: c.strap?.nombre || '—', elegidas: 0 };
        cur.elegidas += cant;
        combos.set(ck, cur);
      }
    }
  }
  const top = (map, n = 5) => [...map.values()].sort((a, b) => b.unidades - a.unidades).slice(0, n);
  const bolsas_top = top(bolsas);
  const straps_top = top(straps);
  const combos_top = [...combos.values()].sort((a, b) => b.elegidas - a.elegidas).slice(0, 5);

  // 4) Qué reponer (estado actual del inventario).
  const { data: vars = [] } = await db
    .from('producto_variantes')
    .select('id, stock, color, producto:productos(nombre)');
  const agotados = vars.filter((v) => v.stock <= 0);
  const bajo = vars.filter((v) => v.stock > 0 && v.stock <= 5);

  // Sin movimiento en 60 días.
  let sin_movimiento = 0;
  const hace60 = new Date(base);
  hace60.setDate(hace60.getDate() - 60);
  const { data: movs, error: movErr } = await db
    .from('movimientos_inventario')
    .select('variante_id')
    .gte('created_at', hace60.toISOString());
  if (!movErr) {
    const conMov = new Set((movs || []).map((m) => m.variante_id));
    sin_movimiento = vars.filter((v) => !conMov.has(v.id)).length;
  }
  const reponer = {
    agotados: agotados.map((v) => `${v.producto?.nombre || 'Producto'} · ${v.color}`),
    bajo: bajo.map((v) => `${v.producto?.nombre || 'Producto'} · ${v.color}`),
    sin_movimiento,
  };

  // 5) Canales de venta (por origen de la clienta del pedido).
  const canalMap = new Map();
  for (const p of pedidos) {
    const c = p.clienta?.canal_origen || 'Sin origen';
    canalMap.set(c, (canalMap.get(c) || 0) + 1);
  }
  const totalCanales = [...canalMap.values()].reduce((s, n) => s + n, 0) || 1;
  const canales = [...canalMap.entries()]
    .map(([canal, numv]) => ({ canal, num: numv, pct: Math.round((numv / totalCanales) * 100) }))
    .sort((a, b) => b.num - a.num);

  return { ready: true, rango, kpis, por_dia, bolsas_top, straps_top, combos_top, reponer, canales };
}
