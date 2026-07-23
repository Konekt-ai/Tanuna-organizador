import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}
const num = (v) => Number(v) || 0;
const ESTATUS_ATENCION = ['Espera respuesta', 'Preguntó por un producto', 'Nueva clienta'];

/* --------------------------------- CRM ----------------------------------- */

const mapClienta = (c) => ({
  id: c.id,
  nombre: c.name,
  telefono: c.phone,
  correo: c.email,
  canal_origen: c.source,
  estatus: c.status,
  producto_interes: c.product_interest,
  ultimo_contacto: c.last_contact,
  nota: c.note,
});

export async function ventasReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('customers').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

export async function listClientas() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('customers').select('*').order('updated_at', { ascending: false });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: (data || []).map(mapClienta) };
}

export function clientasNecesitanAtencion(items) {
  return (items || []).filter((c) => ESTATUS_ATENCION.includes(c.estatus));
}

function clientaPatch(d) {
  const p = {};
  if (d.nombre !== undefined) p.name = (d.nombre || '').trim();
  if (d.telefono !== undefined) p.phone = d.telefono || null;
  if (d.correo !== undefined) p.email = d.correo || null;
  if (d.canal_origen !== undefined) p.source = d.canal_origen || null;
  if (d.estatus !== undefined) p.status = d.estatus;
  if (d.producto_interes !== undefined) p.product_interest = d.producto_interes || null;
  if (d.ultimo_contacto !== undefined) p.last_contact = d.ultimo_contacto || null;
  if (d.nota !== undefined) p.note = d.nota || null;
  return p;
}

export async function createClienta(data) {
  const db = createSupabaseAdmin();
  if (!(data.nombre || '').trim()) throw new Error('El nombre es obligatorio.');
  const { error } = await db.from('customers').insert(clientaPatch(data));
  if (error) throw error;
}
export async function updateClienta(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('customers').update(clientaPatch(data)).eq('id', id);
  if (error) throw error;
}
export async function deleteClienta(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('customers').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------- Pedidos --------------------------------- */

const mapItem = (it) => ({
  id: it.id,
  variante_id: it.variant_id,
  combinacion_id: it.combination_id,
  descripcion: it.description,
  cantidad: it.quantity,
  precio_unitario: it.unit_price,
});
const mapPedido = (o) => ({
  id: o.id,
  folio: o.folio,
  clienta_id: o.customer_id,
  clienta: o.customer ? { id: o.customer.id, nombre: o.customer.name, telefono: o.customer.phone, correo: o.customer.email } : null,
  clienta_nombre: o.customer?.name || 'Sin clienta',
  fecha: o.order_date,
  estado_pago: o.payment_status,
  estado_envio: o.fulfillment_status,
  total: o.total,
  notas_internas: o.internal_notes,
  guia_url: o.tracking_url,
  stock_aplicado: o.stock_applied,
  pedido_items: (o.order_items || []).map(mapItem),
  num_items: (o.order_items || []).length,
});

export async function listPedidos({ estado_envio } = {}) {
  const db = createSupabaseAdmin();
  let q = db
    .from('orders')
    .select('*, customer:customers(id, name, phone, email), order_items(*)')
    .order('created_at', { ascending: false });
  if (estado_envio && estado_envio !== 'Todos') q = q.eq('fulfillment_status', estado_envio);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: (data || []).map(mapPedido) };
}

export async function getPedido(id) {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('orders')
    .select('*, customer:customers(id, name, phone, email), order_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data ? mapPedido(data) : null;
}

export async function createPedido(data) {
  const db = createSupabaseAdmin();
  const items = Array.isArray(data.items) ? data.items : [];
  const total = data.total != null && data.total !== '' ? num(data.total) : items.reduce((s, it) => s + num(it.cantidad) * num(it.precio_unitario), 0);

  const { data: order, error } = await db
    .from('orders')
    .insert({
      customer_id: data.clienta_id || null,
      payment_status: data.estado_pago || 'Pendiente de pago',
      fulfillment_status: data.estado_envio || 'Nuevo pedido',
      total,
      internal_notes: data.notas_internas || null,
      user_id: data.usuario_id || null,
    })
    .select('id, folio')
    .single();
  if (error) throw error;

  if (items.length) {
    const rows = items.map((it) => ({
      order_id: order.id,
      variant_id: it.variante_id || null,
      combination_id: it.combinacion_id || null,
      description: it.descripcion || null,
      quantity: Math.max(1, Math.trunc(num(it.cantidad)) || 1),
      unit_price: num(it.precio_unitario),
    }));
    const { error: e2 } = await db.from('order_items').insert(rows);
    if (e2) throw e2;
  }
  return { id: order.id, folio: order.folio };
}

export async function updatePedido(id, data) {
  const db = createSupabaseAdmin();
  const patch = {};
  if (data.estado_pago !== undefined) patch.payment_status = data.estado_pago;
  if (data.estado_envio !== undefined) patch.fulfillment_status = data.estado_envio;
  if (data.notas_internas !== undefined) patch.internal_notes = data.notas_internas || null;
  if (data.guia_url !== undefined) patch.tracking_url = data.guia_url || null;
  if (data.total !== undefined) patch.total = num(data.total);
  const { error } = await db.from('orders').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePedido(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// Marca el pedido como Enviado y descuenta inventario (una sola vez).
export async function marcarEnviado(id, usuarioId) {
  const db = createSupabaseAdmin();
  const pedido = await getPedido(id);
  if (!pedido) throw new Error('Pedido no encontrado.');

  if (!pedido.stock_aplicado) {
    const req = {};
    for (const it of pedido.pedido_items || []) {
      if (it.variante_id) req[it.variante_id] = (req[it.variante_id] || 0) + (it.cantidad || 0);
    }
    const varIds = Object.keys(req);
    if (varIds.length) {
      const { data: vars } = await db
        .from('product_variants')
        .select('id, stock, name, product:products(name)')
        .in('id', varIds);
      const faltantes = (vars || [])
        .filter((v) => v.stock < req[v.id])
        .map((v) => `${v.product?.name || 'Producto'} · ${v.name} (hay ${v.stock}, necesita ${req[v.id]})`);
      if (faltantes.length) throw new Error('Stock insuficiente para enviar: ' + faltantes.join('; '));

      for (const it of pedido.pedido_items || []) {
        if (!it.variante_id) continue;
        const { error } = await db.from('inventory_movements').insert({
          variant_id: it.variante_id,
          delta: -(it.cantidad || 0),
          type: 'salida',
          reason: `Pedido ${pedido.folio}`,
          order_id: id,
          user_id: usuarioId || null,
        });
        if (error) throw error;
      }
    }
  }

  const { error } = await db.from('orders').update({ fulfillment_status: 'Enviado', stock_applied: true }).eq('id', id);
  if (error) throw error;
}

export async function contarClientas() {
  const db = createSupabaseAdmin();
  const { count, error } = await db.from('customers').select('id', { count: 'exact', head: true });
  if (error) return null;
  return count ?? 0;
}

export async function ventasResumen() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('orders').select('total, fulfillment_status, payment_status');
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  const rows = data || [];
  return {
    pedidos: rows.length,
    por_enviar: rows.filter((p) => ['Nuevo pedido', 'Preparando'].includes(p.fulfillment_status)).length,
    ventas_pagadas: rows.filter((p) => p.payment_status === 'Pagado').reduce((s, p) => s + num(p.total), 0),
  };
}
