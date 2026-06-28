import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// =====================================================================
//  Fotos del Organizador (/estudio.html).
//  POST   -> sube un archivo al bucket "studio" y devuelve { id, url, path }.
//  DELETE -> borra (best-effort) un archivo por su "path".
//  Requiere sesión de admin. Usa service_role para escribir en Storage.
// =====================================================================

export const dynamic = 'force-dynamic';
const BUCKET = 'studio';

function extFor(type) {
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  return 'jpg';
}

export async function POST(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'bad-form' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || file.size === 0) {
    return NextResponse.json({ error: 'no-file' }, { status: 400 });
  }

  // El cliente manda un id estable (uid). Lo limpiamos por seguridad.
  const rawId = String(form.get('id') || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const id = rawId || `img${Date.now()}`;
  const type = file.type || 'image/jpeg';
  const path = `${id}.${extFor(type)}`;

  const admin = createSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ id, url: pub.publicUrl, path });
}

export async function DELETE(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const path = String(body?.path || '');
  if (!path) return NextResponse.json({ ok: true });

  const admin = createSupabaseAdmin();
  await admin.storage.from(BUCKET).remove([path]);
  return NextResponse.json({ ok: true });
}
