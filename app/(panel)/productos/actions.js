'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  createProducto,
  updateProducto,
  deleteProducto,
  addVariante,
  updateVariante,
  deleteVariante,
  addImagen,
  deleteImagen,
} from '@/lib/catalog';

function obj(formData) {
  const o = {};
  for (const [k, v] of formData.entries()) o[k] = v;
  return o;
}

export async function guardarProducto(formData) {
  await requireUser();
  const d = obj(formData);
  d.destacado = formData.get('destacado') === 'on' || formData.get('destacado') === 'true';
  try {
    if (d.id) {
      await updateProducto(d.id, d);
      revalidatePath('/productos');
      return { ok: true, id: d.id };
    }
    const id = await createProducto(d);
    revalidatePath('/productos');
    return { ok: true, id };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarProducto(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  if (!id) return { error: 'Falta el id.' };
  try {
    await deleteProducto(id);
    revalidatePath('/productos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function guardarVariante(formData) {
  await requireUser();
  const d = obj(formData);
  try {
    if (d.id) await updateVariante(d.id, d);
    else await addVariante(d.producto_id, d);
    revalidatePath('/productos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarVariante(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  try {
    await deleteVariante(id);
    revalidatePath('/productos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// Llamada directa desde el cliente tras subir la foto a /api/studio/image.
export async function agregarImagen(productoId, url, rol) {
  await requireUser();
  try {
    await addImagen(productoId, { url, rol });
    revalidatePath('/productos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarImagen(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  try {
    await deleteImagen(id);
    revalidatePath('/productos');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
