'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  crearFlujo,
  toggleFlujo,
  eliminarFlujo as eliminar,
  guardarPlantilla as guardarPl,
  registrarMensaje,
} from '@/lib/whatsapp';

export async function guardarFlujo(formData) {
  await requireUser();
  try {
    await crearFlujo({
      nombre: (formData.get('nombre') || '').toString(),
      disparador: (formData.get('disparador') || '').toString(),
    });
    revalidatePath('/whatsapp');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function cambiarEstadoFlujo(formData) {
  await requireUser();
  try {
    await toggleFlujo((formData.get('id') || '').toString(), (formData.get('estado') || 'activo').toString());
    revalidatePath('/whatsapp');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function eliminarFlujo(formData) {
  await requireUser();
  try {
    await eliminar((formData.get('id') || '').toString());
    revalidatePath('/whatsapp');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function guardarPlantilla(formData) {
  await requireUser();
  try {
    await guardarPl({
      flujo_id: (formData.get('flujo_id') || '').toString(),
      tono: (formData.get('tono') || 'calida').toString(),
      contenido: (formData.get('contenido') || '').toString(),
    });
    revalidatePath('/whatsapp');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// Registra que se envió un mensaje por wa.me (llamada directa desde el cliente).
export async function registrarEnvio({ clienta_id, flujo_id, plantilla_id, contenido }) {
  const user = await requireUser();
  try {
    await registrarMensaje({ clienta_id, flujo_id, plantilla_id, contenido, canal: 'wa_me', usuario_id: user.id });
    revalidatePath('/whatsapp');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
