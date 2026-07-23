'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '@/lib/catalog';

export async function crearCategoria(formData) {
  await requireUser();
  const nombre = (formData.get('nombre') || '').toString().trim();
  if (!nombre) return { error: 'El nombre es obligatorio.' };
  await createCategoria({
    nombre,
    slug: (formData.get('slug') || '').toString(),
    estado: (formData.get('estado') || 'activo').toString(),
  });
  revalidatePath('/categorias');
  return { ok: true };
}

export async function editarCategoria(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  if (!id) return { error: 'Falta el id.' };
  await updateCategoria(id, {
    nombre: (formData.get('nombre') || '').toString(),
    slug: (formData.get('slug') || '').toString(),
    estado: (formData.get('estado') || 'activo').toString(),
  });
  revalidatePath('/categorias');
  return { ok: true };
}

export async function eliminarCategoria(formData) {
  await requireUser();
  const id = (formData.get('id') || '').toString();
  if (!id) return { error: 'Falta el id.' };
  await deleteCategoria(id);
  revalidatePath('/categorias');
  return { ok: true };
}
