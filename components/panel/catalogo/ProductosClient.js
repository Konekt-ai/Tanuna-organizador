'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Star, Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import { Badge } from '@/components/panel/ui';
import {
  guardarProducto,
  eliminarProducto,
  guardarVariante,
  eliminarVariante,
  agregarImagen,
  eliminarImagen,
} from '@/app/(panel)/productos/actions';

const money = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const TIPO_LABEL = { bolsa: 'Bolsas', strap: 'Straps', cinturon: 'Cinturones' };
const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';

function Field({ label, children, span }) {
  return (
    <label className={`block ${span ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

/* --------------------------- Editor de producto -------------------------- */
function ProductoEditor({ producto, categorias, onDone, onCancel, run, busy }) {
  const p = producto || {};
  return (
    <form
      action={(fd) => run(guardarProducto, fd, (res) => onDone(res.id))}
      className="rounded-xl border border-border bg-card p-6 shadow-card-sm"
    >
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl">{p.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <button type="button" onClick={onCancel} aria-label="Cerrar"><X size={18} className="text-muted-foreground" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre"><input name="nombre" defaultValue={p.nombre} required className={inputCls} /></Field>
        <Field label="Tipo">
          <select name="tipo" defaultValue={p.tipo || 'bolsa'} className={inputCls}>
            <option value="bolsa">Bolsa</option>
            <option value="strap">Strap</option>
            <option value="cinturon">Cinturón</option>
          </select>
        </Field>
        <Field label="Categoría">
          <select name="categoria_id" defaultValue={p.categoria_id || ''} className={inputCls}>
            <option value="">— sin categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="Precio base (MXN)"><input name="precio_base" type="number" step="1" defaultValue={p.precio_base ?? ''} className={inputCls} /></Field>
        <Field label="Estado">
          <select name="estado" defaultValue={p.estado || 'borrador'} className={inputCls}>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="destacado" defaultChecked={!!p.destacado} className="h-4 w-4" />
          Destacado
        </label>
        <Field label="Alto (cm)"><input name="dim_alto" type="number" step="0.1" defaultValue={p.dim_alto ?? ''} className={inputCls} /></Field>
        <Field label="Ancho (cm)"><input name="dim_ancho" type="number" step="0.1" defaultValue={p.dim_ancho ?? ''} className={inputCls} /></Field>
        <Field label="Largo (cm)"><input name="dim_largo" type="number" step="0.1" defaultValue={p.dim_largo ?? ''} className={inputCls} /></Field>
        <Field label="Materiales"><input name="materiales" defaultValue={p.materiales || ''} className={inputCls} /></Field>
        <Field label="Cuidados"><input name="cuidados" defaultValue={p.cuidados || ''} className={inputCls} /></Field>
        <Field label="Slug (URL)"><input name="slug" defaultValue={p.slug || ''} placeholder="se genera solo" className={inputCls} /></Field>
        <Field label="Descripción corta" span><input name="descripcion_corta" defaultValue={p.descripcion_corta || ''} className={inputCls} /></Field>
        <Field label="Descripción larga" span>
          <textarea name="descripcion_larga" defaultValue={p.descripcion_larga || ''} rows={3} className={inputCls} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">Cancelar</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

/* --------------------------- Editor de variantes ------------------------- */
function VariantesEditor({ producto, run, busy }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const variantes = producto.producto_variantes || [];

  const Row = ({ v }) => (
    <form action={(fd) => run(guardarVariante, fd, () => setEditId(null))} className="grid grid-cols-2 gap-2 border-b border-border py-2 sm:grid-cols-5">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="producto_id" value={producto.id} />
      <input name="color" defaultValue={v?.color || ''} placeholder="Color" className={inputCls} />
      <input name="sku" defaultValue={v?.sku || ''} placeholder="SKU" className={inputCls} />
      <input name="stock" type="number" defaultValue={v?.stock ?? 0} placeholder="Stock" className={inputCls} />
      <select name="estado" defaultValue={v?.estado || 'disponible'} className={inputCls}>
        <option value="disponible">disponible</option>
        <option value="agotado">agotado</option>
        <option value="oculto">oculto</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">Guardar</button>
        <button type="button" onClick={() => { setEditId(null); setAdding(false); }} className="rounded-lg border border-border px-2 text-sm hover:bg-secondary"><X size={15} /></button>
      </div>
    </form>
  );

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg">Variantes por color</h3>
        <button type="button" onClick={() => { setAdding(true); setEditId(null); }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary">
          <Plus size={15} /> Nueva variante
        </button>
      </div>
      {adding && <Row v={null} />}
      {variantes.map((v) =>
        editId === v.id ? (
          <Row key={v.id} v={v} />
        ) : (
          <div key={v.id} className="flex items-center gap-3 border-b border-border py-2 text-sm last:border-0">
            <span className="flex items-center gap-2 flex-1 min-w-0">
              {v.color_hex && <span className="h-4 w-4 rounded-full border border-border" style={{ background: v.color_hex }} />}
              <span className="truncate">{v.color}</span>
            </span>
            <span className="w-24 truncate font-mono text-xs text-muted-foreground">{v.sku || '—'}</span>
            <span className="w-12 text-right">{v.stock}</span>
            <Badge tone={v.estado === 'disponible' ? 'success' : 'neutral'}>{v.estado}</Badge>
            <button type="button" onClick={() => { setEditId(v.id); setAdding(false); }} className="rounded p-1 hover:bg-secondary"><Pencil size={14} /></button>
            <form action={(fd) => { if (confirm('¿Eliminar variante?')) run(eliminarVariante, fd); }}>
              <input type="hidden" name="id" value={v.id} />
              <button type="submit" className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
            </form>
          </div>
        )
      )}
      {variantes.length === 0 && !adding && <p className="py-4 text-center text-sm text-muted-foreground">Sin variantes. Agrega la primera.</p>}
    </section>
  );
}

/* ---------------------------- Editor de imágenes ------------------------- */
function ImagenesEditor({ producto, run, router }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const imagenes = (producto.producto_imagenes || []).slice().sort((a, b) => a.orden - b.orden);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/studio/image', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al subir la imagen');
      const r = await agregarImagen(producto.id, json.url, 'Catálogo');
      if (r?.error) throw new Error(r.error);
      router.refresh();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg">Imágenes</h3>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-60">
          <Upload size={15} /> {uploading ? 'Subiendo…' : 'Agregar'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      {err && <p className="mb-2 text-sm text-destructive">{err}</p>}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {imagenes.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.rol || ''} className="h-full w-full object-cover" />
            <form action={(fd) => { if (confirm('¿Quitar imagen?')) run(eliminarImagen, fd); }} className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100">
              <input type="hidden" name="id" value={img.id} />
              <button type="submit" className="rounded-md bg-background/90 p-1 text-destructive shadow"><Trash2 size={14} /></button>
            </form>
          </div>
        ))}
        {imagenes.length === 0 && <p className="col-span-full py-4 text-center text-sm text-muted-foreground">Sin imágenes.</p>}
      </div>
    </section>
  );
}

/* ------------------------------ Detalle (ver) ---------------------------- */
function Attr({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

/* ------------------------------ Orquestador ------------------------------ */
export default function ProductosClient({ items, categorias = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [estadoF, setEstadoF] = useState('todos');
  const [selId, setSelId] = useState(items[0]?.id ?? null);
  const [mode, setMode] = useState('view'); // view | edit | new
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action, formData, after) {
    setBusy(true);
    setError('');
    const res = await action(formData);
    setBusy(false);
    if (res?.error) setError(res.error);
    else after?.(res);
  }

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        if (estadoF !== 'todos' && p.estado !== estadoF) return false;
        if (query && !p.nombre.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [items, query, estadoF]
  );

  const sel = items.find((p) => p.id === selId) || null;
  const medidas =
    sel && (sel.dim_alto || sel.dim_ancho || sel.dim_largo)
      ? `${sel.dim_alto ?? '—'} × ${sel.dim_ancho ?? '—'} × ${sel.dim_largo ?? '—'} cm`
      : null;
  const variantes = sel?.producto_variantes || [];
  const imagenes = (sel?.producto_imagenes || []).slice().sort((a, b) => a.orden - b.orden);
  const stockTotal = variantes.reduce((s, v) => s + (v.stock || 0), 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Lista */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-card-sm">
          <button
            type="button"
            onClick={() => { setMode('new'); setSelId(null); }}
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus size={16} /> Nuevo producto
          </button>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto…" maxLength={80} className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring" />
          </div>
          <select value={estadoF} onChange={(e) => setEstadoF(e.target.value)} className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
            <option value="todos">Todos</option>
            <option value="publicado">Publicados</option>
            <option value="borrador">Borradores</option>
          </select>
          <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {filtered.map((p) => {
              const active = sel?.id === p.id;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => { setSelId(p.id); setMode('view'); }} className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${active ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package size={18} className="text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {p.nombre}
                        {p.destacado && <Star size={13} className="text-warning-foreground" />}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{TIPO_LABEL[p.tipo]} · {p.num_variantes} var · Stock {p.stock_total}</span>
                    </span>
                    <span className="text-right text-sm">
                      <span className="block font-medium">{money(p.precio_base)}</span>
                      <Badge tone={p.estado === 'publicado' ? 'success' : 'neutral'}>{p.estado}</Badge>
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</li>}
          </ul>
        </section>

        {/* Panel derecho */}
        {mode === 'new' ? (
          <ProductoEditor categorias={categorias} run={run} busy={busy} onCancel={() => setMode('view')} onDone={(id) => { setMode('view'); if (id) setSelId(id); router.refresh(); }} />
        ) : mode === 'edit' && sel ? (
          <ProductoEditor producto={sel} categorias={categorias} run={run} busy={busy} onCancel={() => setMode('view')} onDone={() => { setMode('view'); router.refresh(); }} />
        ) : sel ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 shadow-card-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{sel.categoria?.nombre || TIPO_LABEL[sel.tipo]}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-3xl">{sel.nombre}</h2>
                    <Badge tone={sel.estado === 'publicado' ? 'success' : 'neutral'}>{sel.estado}</Badge>
                    {sel.destacado && <Badge tone="warning">Destacado</Badge>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">/{sel.slug}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setMode('edit')} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"><Pencil size={15} /> Editar</button>
                  <form action={(fd) => { if (confirm(`¿Eliminar "${sel.nombre}" y sus variantes?`)) run(eliminarProducto, fd, () => { setSelId(null); router.refresh(); }); }}>
                    <input type="hidden" name="id" value={sel.id} />
                    <button type="submit" aria-label="Eliminar" className="rounded-lg border border-border p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Attr label="Precio base" value={money(sel.precio_base)} />
                <Attr label="Stock total" value={stockTotal} />
                <Attr label="Medidas" value={medidas} />
                <Attr label="Materiales" value={sel.materiales} />
                <Attr label="Cuidados" value={sel.cuidados} />
              </div>
              {(sel.descripcion_corta || sel.descripcion_larga) && (
                <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                  {sel.descripcion_corta && <p className="text-foreground">{sel.descripcion_corta}</p>}
                  {sel.descripcion_larga && <p>{sel.descripcion_larga}</p>}
                </div>
              )}
            </section>

            <ImagenesEditor producto={sel} run={run} router={router} />
            <VariantesEditor producto={sel} run={run} busy={busy} />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-10 text-sm text-muted-foreground">
            Selecciona un producto o crea uno nuevo.
          </div>
        )}
      </div>
    </div>
  );
}
