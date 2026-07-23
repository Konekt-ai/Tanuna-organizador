'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClienta, updateClienta, deleteClienta } from '@/lib/ventas';

function obj(formData) {
  const o = {};
  for (const [k, v] of formData.entries()) o[k] = v;
  return o;
}

export async function guardarClienta(formData) {
  await requireUser();
  const d = obj(formData);
  try {
    if (d.id) await updateClienta(d.id, d);
    else await createClienta(d);
    revalidatePath('/clientas');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarClienta(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  try {
    await deleteClienta(id);
    revalidatePath('/clientas');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
