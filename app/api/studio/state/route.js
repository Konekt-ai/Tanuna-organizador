import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// =====================================================================
//  Estado del Organizador (/estudio.html).
//  GET  -> devuelve el documento JSON guardado (bolsas, straps, combos…).
//  PUT  -> guarda el documento JSON completo.
//  Ambos requieren sesión de admin. Las escrituras usan service_role.
// =====================================================================

export const dynamic = 'force-dynamic';
const DOC_ID = 'main';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from('studio_docs')
    .select('data, updated_at')
    .eq('id', DOC_ID)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const doc = data?.data || null;
  // Un objeto vacío {} cuenta como "todavía sin datos".
  const hasData = doc && Object.keys(doc).length > 0;
  return NextResponse.json({
    data: hasData ? doc : null,
    updated_at: data?.updated_at || null,
  });
}

export async function PUT(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }
  const data = body && typeof body === 'object' && 'data' in body ? body.data : body;
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'bad-data' }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('studio_docs')
    .upsert({ id: DOC_ID, data }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
