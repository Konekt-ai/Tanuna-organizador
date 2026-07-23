'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Truck } from 'lucide-react';
import { Badge } from '@/components/panel/ui';
import {
  crearPedido,
  actualizarPedido,
  cambiarEnvio,
  eliminarPedido,
} from '@/app/(panel)/pedidos/actions';

const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(n) || 0);
const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';

const ENVIOS = ['Nuevo pedido', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'];
const PAGOS = ['Pendiente de pago', 'Pagado', 'Reembolsado'];
const TONE_ENVIO = { 'Nuevo pedido': 'accent', Preparando: 'warning', Enviado: 'success', Entregado: 'success', Cancelado: 'danger' };
const TONE_PAGO = { Pagado: 'success', 'Pendiente de pago': 'warning', Reembolsado: 'neutral' };

/* --------------------------- Alta de pedido ------------------------------ */
function NuevoPedido({ clientas, opciones, onClose, onCreated }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);

  function addItem() {
    const first = opciones[0];
    setItems((xs) => [...xs, { key: Math.random().toString(36).slice(2), value: first?.value || '', descripcion: first?.label || '', cantidad: 1, precio_unitario: first?.precio || 0 }]);
  }
  function setItem(key, patch) {
    setItems((xs) => xs.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function onOption(key, value) {
    const o = opciones.find((x) => x.value === value);
    setItem(key, { value, descripcion: o?.label || '', precio_unitario: o?.precio ?? 0 });
  }

  async function submit(formData) {
    setBusy(true);
    setError('');
    const payload = items.map((it) => {
      const [tipo, id] = it.value.split(':');
      return {
        variante_id: tipo === 'var' ? id : null,
        combinacion_id: tipo === 'combo' ? id : null,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
      };
    });
    formData.set('items', JSON.stringify(payload));
    formData.set('total', String(total));
    const res = await crearPedido(formData);
    setBusy(false);
    if (res?.error) setError(res.error);
    else onCreated(res);
  }

  return (
    <form action={submit} className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Nuevo pedido</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X size={18} className="text-muted-foreground" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Clienta</span>
          <select name="clienta_id" className={inputCls} defaultValue=""><option value="">— sin clienta —</option>{clientas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado de pago</span>
          <select name="estado_pago" className={inputCls} defaultValue="Pendiente de pago">{PAGOS.map((e) => <option key={e} value={e}>{e}</option>)}</select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado de envío</span>
          <select name="estado_envio" className={inputCls} defaultValue="Nuevo pedido">{ENVIOS.map((e) => <option key={e} value={e}>{e}</option>)}</select>
        </label>
      </div>

      {/* Líneas */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Productos del pedido</span>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary"><Plus size={13} /> Agregar</button>
        </div>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_70px_90px_auto]">
              <select value={it.value} onChange={(e) => onOption(it.key, e.target.value)} className={inputCls}>
                {opciones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input type="number" min="1" value={it.cantidad} onChange={(e) => setItem(it.key, { cantidad: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
              <input type="number" value={it.precio_unitario} onChange={(e) => setItem(it.key, { precio_unitario: Number(e.target.value) || 0 })} className={inputCls} />
              <button type="button" onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">Sin productos. Agrega al menos uno (o deja el pedido vacío).</p>}
        </div>
        <div className="mt-2 text-right text-sm">Total: <b>{money(total)}</b></div>
      </div>

      <label className="mt-3 block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas internas</span>
        <input name="notas_internas" className={inputCls} placeholder="Notas visibles solo para el equipo…" />
      </label>

      {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">Cancelar</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">{busy ? 'Creando…' : 'Crear pedido'}</button>
      </div>
    </form>
  );
}

/* ------------------------------ Orquestador ------------------------------ */
export default function PedidosClient({ pedidos, clientas, opciones }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState('Todos');
  const [selId, setSelId] = useState(pedidos[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
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

  const lista = useMemo(
    () => (filtro === 'Todos' ? pedidos : pedidos.filter((p) => p.estado_envio === filtro)),
    [pedidos, filtro]
  );
  const sel = pedidos.find((p) => p.id === selId) || null;
  const items = sel?.pedido_items || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['Todos', ...ENVIOS].map((e) => (
            <button key={e} type="button" onClick={() => setFiltro(e)} className={`rounded-full border px-3 py-1.5 text-xs transition ${filtro === e ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-secondary'}`}>{e}</button>
          ))}
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus size={16} /> Nuevo pedido</button>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
      {creating && <NuevoPedido clientas={clientas} opciones={opciones} onClose={() => setCreating(false)} onCreated={(r) => { setCreating(false); if (r.id) setSelId(r.id); router.refresh(); }} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Folio</th>
                <th className="px-3 py-2 font-medium">Clienta</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Envío</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} onClick={() => setSelId(p.id)} className={`cursor-pointer border-b border-border last:border-0 ${sel?.id === p.id ? 'bg-secondary' : 'hover:bg-secondary/30'}`}>
                  <td className="px-3 py-2 font-medium">{p.folio}</td>
                  <td className="px-3 py-2">{p.clienta_nombre}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.fecha}</td>
                  <td className="px-3 py-2"><Badge tone={TONE_ENVIO[p.estado_envio]}>{p.estado_envio}</Badge></td>
                  <td className="px-3 py-2 text-right font-medium">{money(p.total)}</td>
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sin pedidos.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Detalle */}
        {sel ? (
          <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 shadow-card-sm lg:sticky lg:top-20">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Pedido</div>
              <div className="font-serif text-2xl">{sel.folio}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={TONE_PAGO[sel.estado_pago]}>{sel.estado_pago}</Badge>
                <Badge tone={TONE_ENVIO[sel.estado_envio]}>{sel.estado_envio}</Badge>
              </div>
            </div>

            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Clienta</dt><dd>{sel.clienta?.nombre || sel.clienta_nombre || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Fecha</dt><dd>{sel.fecha}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-serif text-lg">{money(sel.total)}</dd></div>
            </dl>

            {items.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Productos</div>
                <ul className="space-y-1 text-sm">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">{it.cantidad}× {it.descripcion || 'Artículo'}</span>
                      <span className="shrink-0 text-muted-foreground">{money(it.cantidad * it.precio_unitario)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cambiar estados */}
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <form action={(fd) => run(actualizarPedido, fd)}>
                <input type="hidden" name="id" value={sel.id} />
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Pago</span>
                <select name="estado_pago" defaultValue={sel.estado_pago} onChange={(e) => e.target.form.requestSubmit()} className={inputCls}>
                  {PAGOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </form>
              <form action={(fd) => run(cambiarEnvio, fd)}>
                <input type="hidden" name="id" value={sel.id} />
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Envío</span>
                <select name="estado_envio" defaultValue={sel.estado_envio} onChange={(e) => e.target.form.requestSubmit()} className={inputCls}>
                  {ENVIOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </form>
            </div>

            {sel.estado_envio !== 'Enviado' && sel.estado_envio !== 'Entregado' && (
              <form action={(fd) => { fd.set('estado_envio', 'Enviado'); run(cambiarEnvio, fd); }}>
                <input type="hidden" name="id" value={sel.id} />
                <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  <Truck size={15} /> Marcar como enviado {items.some((i) => i.variante_id) ? '(descuenta stock)' : ''}
                </button>
              </form>
            )}

            <form action={(fd) => run(actualizarPedido, fd)} className="border-t border-border pt-3">
              <input type="hidden" name="id" value={sel.id} />
              <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Notas internas</span>
              <textarea name="notas_internas" defaultValue={sel.notas_internas || ''} rows={2} className={inputCls} placeholder="Notas visibles solo para el equipo…" />
              <button type="submit" className="mt-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">Guardar notas</button>
            </form>

            <form action={(fd) => { if (confirm(`¿Eliminar el pedido ${sel.folio}?`)) run(eliminarPedido, fd, () => setSelId(null)); }} className="border-t border-border pt-3">
              <input type="hidden" name="id" value={sel.id} />
              <button type="submit" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"><Trash2 size={14} /> Eliminar pedido</button>
            </form>
          </aside>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-10 text-sm text-muted-foreground">Selecciona un pedido.</div>
        )}
      </div>
    </div>
  );
}
