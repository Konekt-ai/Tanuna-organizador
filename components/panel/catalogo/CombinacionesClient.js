'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/panel/ui';
import { guardarCombinacion, eliminarCombinacion } from '@/app/(panel)/combinaciones/actions';

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(n) || 0);

const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';
const LARGOS = ['Corto', 'Medio', 'Largo'];

function Editor({ combo, bolsas, straps, run, busy, onClose }) {
  const c = combo || {};
  return (
    <form action={(fd) => run(guardarCombinacion, fd, onClose)} className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">{c.id ? 'Editar combinación' : 'Nueva combinación'}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X size={18} className="text-muted-foreground" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Bolsa</span>
          <select name="bolsa_id" defaultValue={c.bolsa_id || ''} required className={inputCls}>
            <option value="">— elige —</option>
            {bolsas.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Strap</span>
          <select name="strap_id" defaultValue={c.strap_id || ''} required className={inputCls}>
            <option value="">— elige —</option>
            {straps.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Color</span>
          <input name="color" defaultValue={c.color || ''} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Largo</span>
          <select name="largo" defaultValue={c.largo || ''} className={inputCls}>
            <option value="">—</option>
            {LARGOS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Extra strap (MXN)</span>
          <input name="extra_strap" type="number" step="1" defaultValue={c.extra_strap ?? 0} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Precio final (MXN)</span>
          <input name="precio_final" type="number" step="1" defaultValue={c.precio_final ?? ''} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Stock</span>
          <input name="stock" type="number" defaultValue={c.stock ?? 0} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</span>
          <select name="estado" defaultValue={c.estado || 'activo'} className={inputCls}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="lista_para_tienda" defaultChecked={!!c.lista_para_tienda} className="h-4 w-4" />
          Lista para tienda
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">Cancelar</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}

export default function CombinacionesClient({ items, bolsas, straps }) {
  const router = useRouter();
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

  const editing = items.find((c) => c.id === editId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'combinación' : 'combinaciones'}</p>
        <button type="button" onClick={() => { setCreating((v) => !v); setEditId(null); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus size={16} /> Nueva combinación
        </button>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
      {creating && <Editor bolsas={bolsas} straps={straps} run={run} busy={busy} onClose={() => setCreating(false)} />}
      {editing && <Editor combo={editing} bolsas={bolsas} straps={straps} run={run} busy={busy} onClose={() => setEditId(null)} />}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Bolsa</th>
              <th className="px-3 py-2 font-medium">Color</th>
              <th className="px-3 py-2 font-medium">Strap</th>
              <th className="px-3 py-2 font-medium">Largo</th>
              <th className="px-3 py-2 text-right font-medium">Precio</th>
              <th className="px-3 py-2 text-right font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-3 py-2 font-medium">{c.bolsa?.nombre || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.color || '—'}</td>
                <td className="px-3 py-2">{c.strap?.nombre || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.largo || '—'}</td>
                <td className="px-3 py-2 text-right">{c.precio_final != null ? money(c.precio_final) : '—'}</td>
                <td className="px-3 py-2 text-right">{c.stock}</td>
                <td className="px-3 py-2"><Badge tone={c.estado === 'activo' ? 'success' : 'neutral'}>{c.estado}</Badge></td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => { setEditId(c.id); setCreating(false); }} className="rounded p-1 hover:bg-secondary"><Pencil size={14} /></button>
                    <form action={(fd) => { if (confirm('¿Eliminar combinación?')) run(eliminarCombinacion, fd); }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Aún no hay combinaciones.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
