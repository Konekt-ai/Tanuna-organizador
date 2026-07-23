'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, requireFundadora } from '@/lib/auth';
import {
  updateConfigTienda,
  updateProfileRol,
  toggleProfileActivo,
  reclamarFundadora as reclamar,
} from '@/lib/config';

function obj(formData) {
  const o = {};
  for (const [k, v] of formData.entries()) o[k] = v;
  return o;
}

export async function guardarTienda(formData) {
  try {
    await requireFundadora();
    const d = obj(formData);
    d.envios = {
      costo: Number(d.envio_costo) || 0,
      gratis_desde: Number(d.envio_gratis_desde) || 0,
    };
    await updateConfigTienda(d);
    revalidatePath('/configuracion');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function cambiarRol(formData) {
  try {
    await requireFundadora();
    await updateProfileRol((formData.get('id') || '').toString(), (formData.get('rol') || '').toString());
    revalidatePath('/configuracion');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function cambiarActivo(formData) {
  try {
    await requireFundadora();
    const activo = formData.get('activo') === 'true';
    await toggleProfileActivo((formData.get('id') || '').toString(), activo);
    revalidatePath('/configuracion');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// Arranque: cualquier cuenta puede reclamar fundadora SOLO si aún no hay ninguna.
export async function reclamarFundadora() {
  try {
    const user = await requireUser();
    await reclamar(user.id);
    revalidatePath('/configuracion');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
