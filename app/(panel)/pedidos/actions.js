'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  createPedido,
  updatePedido,
  deletePedido,
  marcarEnviado,
} from '@/lib/ventas';

export async function crearPedido(formData) {
  const user = await requireUser();
  let items = [];
  try {
    items = JSON.parse(formData.get('items') || '[]');
  } catch {
    items = [];
  }
  try {
    const pedido = await createPedido({
      clienta_id: (formData.get('clienta_id') || '').toString() || null,
      estado_pago: (formData.get('estado_pago') || 'Pendiente de pago').toString(),
      estado_envio: (formData.get('estado_envio') || 'Nuevo pedido').toString(),
      notas_internas: (formData.get('notas_internas') || '').toString(),
      total: formData.get('total'),
      items,
      usuario_id: user.id,
    });
    revalidatePath('/pedidos');
    return { ok: true, id: pedido.id, folio: pedido.folio };
  } catch (e) {
    return { error: e.message };
  }
}

export async function actualizarPedido(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  const patch = {};
  if (formData.has('estado_pago')) patch.estado_pago = formData.get('estado_pago').toString();
  if (formData.has('estado_envio')) patch.estado_envio = formData.get('estado_envio').toString();
  if (formData.has('notas_internas')) patch.notas_internas = formData.get('notas_internas').toString();
  if (formData.has('guia_url')) patch.guia_url = formData.get('guia_url').toString();
  try {
    await updatePedido(id, patch);
    revalidatePath('/pedidos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// Cambia el estado de envío. Si es "Enviado", descuenta inventario (una vez).
export async function cambiarEnvio(formData) {
  const user = await requireUser();
  const id = (formData.get('id') || '').toString();
  const nuevo = (formData.get('estado_envio') || '').toString();
  try {
    if (nuevo === 'Enviado') await marcarEnviado(id, user.id);
    else await updatePedido(id, { estado_envio: nuevo });
    revalidatePath('/pedidos');
    revalidatePath('/inventario');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarPedido(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  try {
    await deletePedido(id);
    revalidatePath('/pedidos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
