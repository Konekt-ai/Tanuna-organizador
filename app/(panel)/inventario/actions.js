'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createMovimiento } from '@/lib/inventario';

export async function registrarMovimiento(formData) {
  const user = await requireUser();
  const direccion = (formData.get('direccion') || 'aumentar').toString();
  const variante_id = (formData.get('variante_id') || '').toString();
  const cantidad = Math.abs(Math.trunc(Number(formData.get('cantidad')) || 0));
  const motivo = (formData.get('motivo') || '').toString();
  const nota = (formData.get('nota') || '').toString();

  if (!variante_id) return { error: 'Elige la variante.' };
  if (cantidad <= 0) return { error: 'Indica cuántas piezas.' };

  const delta = direccion === 'disminuir' ? -cantidad : cantidad;
  const tipo =
    motivo === 'Ajuste por conteo'
      ? 'ajuste'
      : direccion === 'disminuir'
        ? 'salida'
        : 'entrada';

  try {
    await createMovimiento({ variante_id, delta, tipo, motivo, nota, usuario_id: user.id });
    revalidatePath('/inventario');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
