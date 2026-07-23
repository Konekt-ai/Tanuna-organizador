import { NextResponse } from 'next/server';
import { getProfile, requireUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { slugify } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

// Migra el catálogo del Organizador (studio_docs 'main', un JSON) a las tablas
// relacionales (categorias, productos, producto_variantes, producto_imagenes,
// combinaciones). Es IDEMPOTENTE (upsert por origen_id) y NO borra nada: el
// blob queda intacto como respaldo.
//
// POST /api/catalog/migrate            -> DRY-RUN (solo reporta lo que haría)
// POST /api/catalog/migrate {"apply": true} -> aplica los cambios
//
// Requiere sesión; si ya hay roles, exige fundadora.

const TIPO_POR_ARRAY = { bags: 'bolsa', straps: 'strap', belts: 'cinturon' };

function colorDe(item) {
  return item.color || item.colorMain || item.leatherBase || '';
}
function precioDe(item) {
  return Number(item.basePrice ?? item.price ?? 0) || 0;
}

export async function POST(request) {
  await requireUser();
  const profile = await getProfile();
  // Si ya existe el sistema de roles, solo la fundadora migra. Si aún no hay
  // profiles (fase temprana), se permite a cualquier sesión válida.
  if (profile && profile.rol !== 'fundadora') {
    return NextResponse.json(
      { error: 'Solo la fundadora puede migrar el catálogo.' },
      { status: 403 }
    );
  }

  let apply = false;
  try {
    const body = await request.json();
    apply = body?.apply === true;
  } catch {
    /* sin body = dry-run */
  }

  const db = createSupabaseAdmin();

  // 1) Lee el blob del Organizador.
  const { data: doc, error: docErr } = await db
    .from('studio_docs')
    .select('data')
    .eq('id', 'main')
    .maybeSingle();
  if (docErr) {
    return NextResponse.json({ error: docErr.message }, { status: 500 });
  }
  const state = doc?.data || {};
  const images = state.images || {};
  const httpUrl = (id) => {
    const u = images[id];
    return typeof u === 'string' && /^https?:\/\//.test(u) ? u : null;
  };

  const summary = {
    apply,
    categorias: 0,
    productos: 0,
    variantes: 0,
    imagenes: 0,
    combinaciones: 0,
    avisos: [],
  };

  // Helper: upsert por origen_id (busca, si existe actualiza, si no inserta).
  async function upsert(table, origenId, values) {
    const { data: existing } = await db
      .from(table)
      .select('id')
      .eq('origen_id', origenId)
      .maybeSingle();
    if (!apply) return existing?.id || `nuevo:${origenId}`;
    if (existing) {
      const { error } = await db.from(table).update(values).eq('id', existing.id);
      if (error) throw error;
      return existing.id;
    }
    const { data, error } = await db
      .from(table)
      .insert({ ...values, origen_id: origenId })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  try {
    // 2) Categorías (a partir de los textos de category de las bolsas).
    const catNombres = new Set();
    for (const b of state.bags || []) {
      if (b.category && b.category.trim()) catNombres.add(b.category.trim());
    }
    const catIdPorNombre = {};
    for (const nombre of catNombres) {
      const origen = `cat:${slugify(nombre)}`;
      const id = await upsert('categorias', origen, {
        nombre,
        slug: slugify(nombre),
        estado: 'activo',
      });
      catIdPorNombre[nombre] = id;
      summary.categorias++;
    }

    // 3) Productos + su variante + imágenes.
    const prodIdPorOrigen = {};
    for (const [arrayKey, tipo] of Object.entries(TIPO_POR_ARRAY)) {
      for (const item of state[arrayKey] || []) {
        if (!item?.id) continue;
        const nombre = item.name || 'Sin nombre';
        const prodValues = {
          tipo,
          nombre,
          slug: slugify(`${nombre}-${item.id}`.slice(0, 60)),
          categoria_id: item.category ? catIdPorNombre[item.category.trim()] ?? null : null,
          descripcion_corta: item.descShort || null,
          descripcion_larga: item.descLong || null,
          precio_base: precioDe(item),
          estado: item.status === 'Activa' || item.status === 'Publicado' ? 'publicado' : 'borrador',
          dim_alto: Number(item.dimH) || null,
          dim_ancho: Number(item.dimW) || null,
          dim_largo: Number(item.dimD) || null,
          materiales: item.material || null,
          cuidados: item.care || null,
          extra: {
            size: item.size ?? null,
            type: item.type ?? null,
            weight: item.weight ?? null,
            hardware: item.hardware ?? null,
            tags: item.tags ?? [],
            notes: item.notes ?? null,
            legacy_status: item.status ?? null,
          },
        };
        const prodId = await upsert('productos', item.id, prodValues);
        prodIdPorOrigen[item.id] = prodId;
        summary.productos++;

        // Una variante por producto (color/stock/sku del Organizador).
        await upsert('producto_variantes', `var:${item.id}`, {
          producto_id: apply ? prodId : undefined,
          color: colorDe(item) || 'Único',
          sku: item.sku || null,
          stock: Math.max(0, Number(item.stock) || 0),
          estado: (Number(item.stock) || 0) > 0 ? 'disponible' : 'agotado',
        });
        summary.variantes++;

        // Imágenes con URL http (las dataURL locales se omiten).
        const photos = item.photos || {};
        let orden = 0;
        for (const [slot, imgId] of Object.entries(photos)) {
          const url = httpUrl(imgId);
          if (!url) continue;
          await upsert('producto_imagenes', String(imgId), {
            producto_id: apply ? prodId : undefined,
            url,
            rol: (item.photoRoles && item.photoRoles[slot]) || slot,
            orden: orden++,
          });
          summary.imagenes++;
        }
      }
    }

    // 4) Combinaciones.
    for (const c of state.combos || []) {
      if (!c?.id) continue;
      const bolsa_id = prodIdPorOrigen[c.bagId];
      const strap_id = prodIdPorOrigen[c.strapId];
      if (!bolsa_id || !strap_id) {
        summary.avisos.push(`Combo ${c.id}: falta bolsa o strap referenciado.`);
        continue;
      }
      await upsert('combinaciones', c.id, {
        bolsa_id: apply ? bolsa_id : undefined,
        strap_id: apply ? strap_id : undefined,
        precio_final: Number(c.finalPrice) || null,
        estado: 'activo',
        lista_para_tienda: c.ready === true,
      });
      summary.combinaciones++;
    }
  } catch (e) {
    return NextResponse.json(
      { error: e.message, parcial: summary },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    modo: apply ? 'aplicado' : 'dry-run (no se escribió nada)',
    resumen: summary,
  });
}
