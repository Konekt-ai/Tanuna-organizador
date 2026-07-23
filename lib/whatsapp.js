import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function isMissingTable(error) {
  return error && (error.code === '42P01' || /does not exist/i.test(error.message || ''));
}

export function renderPlantilla(contenido, vars = {}) {
  return (contenido || '').replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null && vars[k] !== '' ? vars[k] : `{{${k}}}`));
}

export async function whatsappReady() {
  const db = createSupabaseAdmin();
  const { error } = await db.from('wa_flows').select('id').limit(1);
  if (error && isMissingTable(error)) return false;
  return true;
}

const mapFlujo = (f) => ({
  id: f.id,
  nombre: f.name,
  disparador: f.trigger_text,
  estado: f.status,
  orden: f.position,
  wa_plantillas: (f.wa_templates || []).map((t) => ({ id: t.id, tono: t.tone, contenido: t.content })),
});

export async function listFlujos() {
  const db = createSupabaseAdmin();
  const { data, error } = await db.from('wa_flows').select('*, wa_templates(*)').order('position', { ascending: true });
  if (error) {
    if (isMissingTable(error)) return { ready: false, items: [] };
    throw error;
  }
  return { ready: true, items: (data || []).map(mapFlujo) };
}

export async function crearFlujo({ nombre, disparador }) {
  const db = createSupabaseAdmin();
  const nom = (nombre || '').trim();
  if (!nom) throw new Error('El nombre del flujo es obligatorio.');
  const slug = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 5);
  const { data: maxRow } = await db.from('wa_flows').select('position').order('position', { ascending: false }).limit(1).maybeSingle();
  const { error } = await db.from('wa_flows').insert({ slug, name: nom, trigger_text: disparador || null, position: (maxRow?.position ?? 0) + 1 });
  if (error) throw error;
}

export async function toggleFlujo(id, estado) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('wa_flows').update({ status: estado }).eq('id', id);
  if (error) throw error;
}

export async function eliminarFlujo(id) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('wa_flows').delete().eq('id', id);
  if (error) throw error;
}

export async function guardarPlantilla({ flujo_id, tono, contenido }) {
  const db = createSupabaseAdmin();
  if (!contenido?.trim()) throw new Error('El contenido no puede estar vacío.');
  const { error } = await db.from('wa_templates').upsert({ flow_id: flujo_id, tone: tono, content: contenido.trim() }, { onConflict: 'flow_id,tone' });
  if (error) throw error;
}

export async function registrarMensaje({ clienta_id, flujo_id, plantilla_id, contenido, canal = 'wa_me', usuario_id }) {
  const db = createSupabaseAdmin();
  const { error } = await db.from('wa_messages').insert({
    customer_id: clienta_id || null,
    flow_id: flujo_id || null,
    template_id: plantilla_id || null,
    content: contenido || null,
    channel: canal,
    user_id: usuario_id || null,
  });
  if (error) throw error;
}

export async function waKpis() {
  const db = createSupabaseAdmin();
  const [{ data: flujos }, { data: msgs }] = await Promise.all([
    db.from('wa_flows').select('status'),
    db.from('wa_messages').select('created_at'),
  ]);
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    flujos_activos: (flujos || []).filter((f) => f.status === 'activo').length,
    flujos_total: (flujos || []).length,
    mensajes_hoy: (msgs || []).filter((m) => (m.created_at || '').slice(0, 10) === hoy).length,
    mensajes_total: (msgs || []).length,
  };
}
