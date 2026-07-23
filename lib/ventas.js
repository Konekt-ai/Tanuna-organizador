import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

// Estatus de clienta que se consideran "necesitan atención".
const ESTATUS_ATENCION = ['Espera respuesta', 'Preguntó por un producto', 'Nueva clienta'];

/* --------------------------------- CRM ----------------------------------- */

export async function ventasReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('clientas').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

export async function listClientas() {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('clientas')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: data || [] };
}

export function clientasNecesitanAtencion(items) {
  return (items || []).filter((c) => ESTATUS_ATENCION.includes(c.estatus));
}

function clientaPatch(d) {
  const p = {};
  if (d.nombre !== undefined) p.nombre = (d.nombre || '').trim();
  if (d.telefono !== undefined) p.telefono = d.telefono || null;
  if (d.correo !== undefined) p.correo = d.correo || null;
  if (d.canal_origen !== undefined) p.canal_origen = d.canal_origen || null;
  if (d.estatus !== undefined) p.estatus = d.estatus;
  if (d.producto_interes !== undefined) p.producto_interes = d.producto_interes || null;
  if (d.ultimo_contacto !== undefined) p.ultimo_contacto = d.ultimo_contacto || null;
  if (d.nota !== undefined) p.nota = d.nota || null;
  return p;
}

export async function createClienta(data) {
  const db = createSupabaseAdmin();
  if (!(data.nombre || '').trim()) throw new Error('El nombre es obligatorio.');
  const { error } = await db.from('clientas').insert(clientaPatch(data));
  if (error) throw error;
}

export async function updateClienta(id, data) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('clientas').update(clientaPatch(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteClienta(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('clientas').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------- Pedidos --------------------------------- */

export async function listPedidos({ estado_envio } = {}) {
  const db = createSupabaseAdmin();
  let q = db
    .from('pedidos')
    .select('*, clienta:clientas(id, nombre, telefono, correo), pedido_items(*)')
    .order('created_at', { ascending: false });
  if (estado_envio && estado_envio !== 'Todos') q = q.eq('estado_envio', estado_envio);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  const items = (data || []).map((p) => ({
    ...p,
    clienta_nombre: p.clienta?.nombre || 'Sin clienta',
    num_items: p.pedido_items?.length || 0,
  }));
  return { ready: true, items };
}

export async function getPedido(id) {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from('pedidos')
    .select('*, clienta:clientas(id, nombre, telefono, correo), pedido_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data;
}

const num = (v) => Number(v) || 0;

export async function createPedido(data) {
  const db = createSupabaseAdmin();
  const items = Array.isArray(data.items) ? data.items : [];
  const total =
    data.total != null && data.total !== ''
      ? num(data.total)
      : items.reduce((s, it) => s + num(it.cantidad) * num(it.precio_unitario), 0);

  const { data: pedido, error } = await db
    .from('pedidos')
    .insert({
      clienta_id: data.clienta_id || null,
      estado_pago: data.estado_pago || 'Pendiente de pago',
      estado_envio: data.estado_envio || 'Nuevo pedido',
      total,
      notas_internas: data.notas_internas || null,
      usuario_id: data.usuario_id || null,
    })
    .select('id, folio')
    .single();
  if (error) throw error;

  if (items.length) {
    const rows = items.map((it) => ({
      pedido_id: pedido.id,
      variante_id: it.variante_id || null,
      combinacion_id: it.combinacion_id || null,
      descripcion: it.descripcion || null,
      cantidad: Math.max(1, Math.trunc(num(it.cantidad)) || 1),
      precio_unitario: num(it.precio_unitario),
    }));
    const { error: e2 } = await db.from('pedido_items').insert(rows);
    if (e2) throw e2;
  }
  return pedido;
}

export async function updatePedido(id, data) {
  const db = createSupabaseAdmin();
  const patch = {};
  if (data.estado_pago !== undefined) patch.estado_pago = data.estado_pago;
  if (data.estado_envio !== undefined) patch.estado_envio = data.estado_envio;
  if (data.notas_internas !== undefined) patch.notas_internas = data.notas_internas || null;
  if (data.guia_url !== undefined) patch.guia_url = data.guia_url || null;
  if (data.total !== undefined) patch.total = num(data.total);
  const { error } = await db.from('pedidos').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePedido(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('pedidos').delete().eq('id', id);
  if (error) throw error;
}

// Marca el pedido como Enviado y DESCUENTA inventario (una sola vez).
// Verifica stock suficiente antes de aplicar; si falta, no envía y avisa.
export async function marcarEnviado(id, usuarioId) {
  const db = createSupabaseAdmin();
  const pedido = await getPedido(id);
  if (!pedido) throw new Error('Pedido no encontrado.');

  if (!pedido.stock_aplicado) {
    // Agrega lo requerido por variante.
    const req = {};
    for (const it of pedido.pedido_items || []) {
      if (it.variante_id) req[it.variante_id] = (req[it.variante_id] || 0) + (it.cantidad || 0);
    }
    const varIds = Object.keys(req);
    if (varIds.length) {
      const { data: vars } = await db
        .from('producto_variantes')
        .select('id, stock, color, producto:productos(nombre)')
        .in('id', varIds);
      const faltantes = (vars || [])
        .filter((v) => v.stock < req[v.id])
        .map((v) => `${v.producto?.nombre || 'Producto'} · ${v.color} (hay ${v.stock}, necesita ${req[v.id]})`);
      if (faltantes.length) {
        throw new Error('Stock insuficiente para enviar: ' + faltantes.join('; '));
      }
      // Inserta las salidas (el trigger de inventario ajusta el stock).
      for (const it of pedido.pedido_items || []) {
        if (!it.variante_id) continue;
        const { error } = await db.from('movimientos_inventario').insert({
          variante_id: it.variante_id,
          delta: -(it.cantidad || 0),
          tipo: 'salida',
          motivo: `Pedido ${pedido.folio}`,
          pedido_id: id,
          usuario_id: usuarioId || null,
        });
        if (error) throw error;
      }
    }
  }

  const { error } = await db
    .from('pedidos')
    .update({ estado_envio: 'Enviado', stock_aplicado: true })
    .eq('id', id);
  if (error) throw error;
}

export async function contarClientas() {
  const db = createSupabaseAdmin();
  const { count, error } = await db.from('clientas').select('id', { count: 'exact', head: true });
  if (error) return null;
  return count ?? 0;
}

// KPIs simples para el dashboard.
export async function ventasResumen() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('pedidos').select('total, estado_envio, estado_pago');
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  const rows = data || [];
  return {
    pedidos: rows.length,
    por_enviar: rows.filter((p) => ['Nuevo pedido', 'Preparando'].includes(p.estado_envio)).length,
    ventas_pagadas: rows.filter((p) => p.estado_pago === 'Pagado').reduce((s, p) => s + num(p.total), 0),
  };
}
