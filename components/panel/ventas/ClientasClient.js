'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, MessageCircle, Mail } from 'lucide-react';
import { Badge } from '@/components/panel/ui';
import { guardarClienta, eliminarClienta } from '@/app/(panel)/clientas/actions';

const ESTATUS = [
  'Nueva clienta',
  'Preguntó por un producto',
  'Espera respuesta',
  'Compra realizada',
  'No continuó la compra',
];
const CANALES = ['WhatsApp', 'Instagram', 'Popup', 'Formulario', 'Compra', 'Otro'];
const TONE = {
  'Compra realizada': 'success',
  'Espera respuesta': 'warning',
  'Preguntó por un producto': 'accent',
  'Nueva clienta': 'neutral',
  'No continuó la compra': 'danger',
};
const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';

const iniciales = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const waLink = (tel, nombre) =>
  `https://wa.me/${(tel || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${nombre || ''}, te escribo de Taluna 🤎`)}`;

function ClientaForm({ clienta, onClose, run, busy }) {
  const c = clienta || {};
  return (
    <form action={(fd) => run(guardarClienta, fd, onClose)} className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">{c.id ? 'Editar clienta' : 'Nueva clienta'}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X size={18} className="text-muted-foreground" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</span><input name="nombre" defaultValue={c.nombre} required className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Teléfono</span><input name="telefono" defaultValue={c.telefono || ''} placeholder="+52 55 1234 5678" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Correo</span><input name="correo" type="email" defaultValue={c.correo || ''} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Estatus</span>
          <select name="estatus" defaultValue={c.estatus || 'Nueva clienta'} className={inputCls}>{ESTATUS.map((e) => <option key={e} value={e}>{e}</option>)}</select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Canal de origen</span>
          <select name="canal_origen" defaultValue={c.canal_origen || ''} className={inputCls}><option value="">—</option>{CANALES.map((e) => <option key={e} value={e}>{e}</option>)}</select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Producto de interés</span><input name="producto_interes" defaultValue={c.producto_interes || ''} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Último contacto</span><input name="ultimo_contacto" type="date" defaultValue={c.ultimo_contacto || ''} className={inputCls} /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota / tarea sugerida</span><input name="nota" defaultValue={c.nota || ''} className={inputCls} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">Cancelar</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}

function Avatar({ nombre }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'oklch(0.62 0.14 40)' }}>
      {iniciales(nombre)}
    </span>
  );
}

export default function ClientasClient({ items, atencion }) {
  const router = useRouter();
  const [selId, setSelId] = useState(items[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action, fd, after) {
    setBusy(true);
    setError('');
    const res = await action(fd);
    setBusy(false);
    if (res?.error) setError(res.error);
    else { after?.(); router.refresh(); }
  }

  const sel = items.find((c) => c.id === selId) || null;
  const editing = items.find((c) => c.id === editId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{items.length} clientas</p>
        <button type="button" onClick={() => { setCreating((v) => !v); setEditId(null); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus size={16} /> Nueva clienta
        </button>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
      {creating && <ClientaForm run={run} busy={busy} onClose={() => setCreating(false)} />}
      {editing && <ClientaForm clienta={editing} run={run} busy={busy} onClose={() => setEditId(null)} />}

      {/* Necesitan atención */}
      {atencion.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl">Clientas que necesitan atención</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {atencion.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-card-sm">
                <div className="flex items-center gap-3">
                  <Avatar nombre={c.nombre} />
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => setSelId(c.id)} className="block truncate text-left text-sm font-medium hover:text-accent">{c.nombre}</button>
                    <div className="truncate text-xs text-muted-foreground">{c.producto_interes || 'Sin producto'}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge tone={TONE[c.estatus]}>{c.estatus}</Badge>
                  {c.telefono && (
                    <a href={waLink(c.telefono, c.nombre)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Todas + detalle */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-3 font-serif text-xl">Todas las clientas</h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card-sm">
            {items.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelId(c.id)} className={`flex w-full items-center gap-3 p-3 text-left transition ${sel?.id === c.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
                <Avatar nombre={c.nombre} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.nombre}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.producto_interes || 'Sin producto'}{c.canal_origen ? ` · desde ${c.canal_origen}` : ''}
                  </div>
                </div>
                <Badge tone={TONE[c.estatus]}>{c.estatus}</Badge>
              </button>
            ))}
            {items.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Aún no hay clientas.</div>}
          </div>
        </section>

        {sel && (
          <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card-sm lg:sticky lg:top-20">
            <div className="flex items-center gap-3">
              <Avatar nombre={sel.nombre} />
              <div className="min-w-0">
                <div className="truncate font-serif text-lg">{sel.nombre}</div>
                <Badge tone={TONE[sel.estatus]}>{sel.estatus}</Badge>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {sel.correo && <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Correo</dt><dd className="break-words">{sel.correo}</dd></div>}
              {sel.telefono && <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</dt><dd>{sel.telefono}</dd></div>}
              {sel.producto_interes && <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Interés</dt><dd>{sel.producto_interes}</dd></div>}
              {sel.canal_origen && <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Origen</dt><dd>{sel.canal_origen}</dd></div>}
              {sel.ultimo_contacto && <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Último contacto</dt><dd>{sel.ultimo_contacto}</dd></div>}
              {sel.nota && <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Tarea sugerida</dt><dd>{sel.nota}</dd></div>}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {sel.telefono && (
                <a href={waLink(sel.telefono, sel.nombre)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {sel.correo && (
                <a href={`mailto:${sel.correo}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                  <Mail size={15} /> Correo
                </a>
              )}
            </div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <button type="button" onClick={() => { setEditId(sel.id); setCreating(false); }} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary"><Pencil size={14} /> Editar</button>
              <form action={(fd) => { if (confirm(`¿Eliminar a ${sel.nombre}?`)) run(eliminarClienta, fd, () => setSelId(null)); }}>
                <input type="hidden" name="id" value={sel.id} />
                <button type="submit" className="rounded-lg border border-border p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive"><Trash2 size={15} /></button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
