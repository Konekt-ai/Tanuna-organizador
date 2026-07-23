'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createCombinacion, updateCombinacion, deleteCombinacion } from '@/lib/catalog';

function obj(formData) {
  const o = {};
  for (const [k, v] of formData.entries()) o[k] = v;
  o.lista_para_tienda = formData.get('lista_para_tienda') === 'on';
  return o;
}

export async function guardarCombinacion(formData) {
  await requireUser();
  const d = obj(formData);
  try {
    if (d.id) await updateCombinacion(d.id, d);
    else await createCombinacion(d);
    revalidatePath('/combinaciones');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarCombinacion(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  try {
    await deleteCombinacion(id);
    revalidatePath('/combinaciones');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
