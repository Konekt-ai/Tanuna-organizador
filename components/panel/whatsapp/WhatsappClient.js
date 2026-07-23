'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Pencil, Send, Power } from 'lucide-react';
import { Badge, Card } from '@/components/panel/ui';
import {
  guardarFlujo,
  cambiarEstadoFlujo,
  eliminarFlujo,
  guardarPlantilla,
  registrarEnvio,
} from '@/app/(panel)/whatsapp/actions';

const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';
const WA_GREEN = '#25D366';

function render(contenido, vars) {
  return (contenido || '').replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null && vars[k] !== '' ? vars[k] : `{{${k}}}`));
}
const plantillaDe = (flujo, tono) => (flujo?.wa_plantillas || []).find((p) => p.tono === tono);

/* ------------------------------- Flujos ---------------------------------- */
function FlujoCard({ flujo, run, busy }) {
  const [editing, setEditing] = useState(false);
  const activo = flujo.estado === 'activo';
  const nPlantillas = (flujo.wa_plantillas || []).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{flujo.nombre}</div>
          <div className="text-xs text-muted-foreground">{flujo.disparador || 'Sin disparador'}</div>
        </div>
        <Badge tone={activo ? 'success' : 'neutral'}>{flujo.estado}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{nPlantillas} {nPlantillas === 1 ? 'plantilla' : 'plantillas'}</span>
        <div className="flex items-center gap-1">
          <form action={(fd) => run(cambiarEstadoFlujo, fd)}>
            <input type="hidden" name="id" value={flujo.id} />
            <input type="hidden" name="estado" value={activo ? 'pausado' : 'activo'} />
            <button type="submit" disabled={busy} title={activo ? 'Pausar' : 'Activar'} className="rounded p-1.5 hover:bg-secondary"><Power size={15} className={activo ? 'text-success' : 'text-muted-foreground'} /></button>
          </form>
          <button type="button" onClick={() => setEditing((v) => !v)} className="rounded p-1.5 hover:bg-secondary"><Pencil size={15} /></button>
          <form action={(fd) => { if (confirm(`¿Eliminar el flujo "${flujo.nombre}"?`)) run(eliminarFlujo, fd); }}>
            <input type="hidden" name="id" value={flujo.id} />
            <button type="submit" className="rounded p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
          </form>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {['calida', 'directa'].map((tono) => {
            const pl = plantillaDe(flujo, tono);
            return (
              <form key={tono} action={(fd) => run(guardarPlantilla, fd, () => {})} className="space-y-1">
                <input type="hidden" name="flujo_id" value={flujo.id} />
                <input type="hidden" name="tono" value={tono} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tono {tono === 'calida' ? 'cálido' : 'directo'}</span>
                  <button type="submit" disabled={busy} className="text-xs text-accent hover:underline">Guardar</button>
                </div>
                <textarea name="contenido" defaultValue={pl?.contenido || ''} rows={2} placeholder="Usa {{nombre}}, {{producto}}, {{pedido}}…" className={inputCls} />
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Envío ----------------------------------- */
function Enviar({ flujos, clientas }) {
  const router = useRouter();
  const activos = flujos.filter((f) => (f.wa_plantillas || []).length > 0);
  const [flujoId, setFlujoId] = useState(activos[0]?.id || '');
  const [tono, setTono] = useState('calida');
  const [clientaId, setClientaId] = useState(clientas[0]?.id || '');
  const [producto, setProducto] = useState('');
  const [pedido, setPedido] = useState('');
  const [msg, setMsg] = useState('');

  const flujo = flujos.find((f) => f.id === flujoId);
  const clienta = clientas.find((c) => c.id === clientaId);
  const pl = plantillaDe(flujo, tono) || plantillaDe(flujo, 'calida');
  const vars = { nombre: clienta?.nombre?.split(' ')[0] || 'clienta', producto: producto || 'tu pieza', pedido: pedido || 'tu pedido', tienda: 'Taluna' };
  const texto = render(pl?.contenido, vars);
  const tel = (clienta?.telefono || '').replace(/\D/g, '');
  const waLink = `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;

  async function enviar() {
    setMsg('');
    // Registra el envío y abre WhatsApp.
    const res = await registrarEnvio({ clienta_id: clientaId || null, flujo_id: flujoId || null, plantilla_id: pl?.id || null, contenido: texto });
    if (res?.error) { setMsg(res.error); return; }
    window.open(waLink, '_blank', 'noopener');
    setMsg('Mensaje abierto en WhatsApp y registrado.');
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Enviar por WhatsApp">
        <div className="space-y-3">
          <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Flujo</span>
            <select value={flujoId} onChange={(e) => setFlujoId(e.target.value)} className={inputCls}>
              {activos.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              {activos.length === 0 && <option value="">Crea un flujo con plantilla primero</option>}
            </select>
          </label>
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Plantilla</span>
            <div className="flex gap-2">
              {['calida', 'directa'].map((t) => {
                const disponible = !!plantillaDe(flujo, t);
                return (
                  <button key={t} type="button" disabled={!disponible} onClick={() => setTono(t)} className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-40 ${tono === t ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-secondary'}`}>
                    {t === 'calida' ? 'Cálida' : 'Directa'}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Clienta</span>
            <select value={clientaId} onChange={(e) => setClientaId(e.target.value)} className={inputCls}>
              {clientas.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` — ${c.telefono}` : ''}</option>)}
              {clientas.length === 0 && <option value="">Agrega clientas en el CRM</option>}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Producto</span><input value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Bolsa Maráica" className={inputCls} /></label>
            <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Pedido</span><input value={pedido} onChange={(e) => setPedido(e.target.value)} placeholder="T-1042" className={inputCls} /></label>
          </div>
          {!tel && clienta && <p className="text-xs text-warning-foreground">Esta clienta no tiene teléfono; agrégalo en el CRM para poder abrir WhatsApp.</p>}
          <button type="button" onClick={enviar} disabled={!pl || !tel} className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50" style={{ background: WA_GREEN }}>
            <Send size={16} /> Abrir en WhatsApp
          </button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </Card>

      {/* Vista previa tipo chat */}
      <Card title="Vista previa del mensaje">
        <div className="rounded-xl p-4" style={{ background: 'oklch(0.95 0.02 150)' }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'oklch(0.62 0.14 40)' }}>
              {(clienta?.nombre || 'C').slice(0, 2).toUpperCase()}
            </span>
            <div className="text-sm">
              <div className="font-medium text-foreground">{clienta?.nombre || 'Clienta'}</div>
              <div className="text-xs text-muted-foreground">{clienta?.telefono || 'sin teléfono'} · en línea</div>
            </div>
          </div>
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-[#0b3b1e]" style={{ background: '#DCF8C6' }}>
            {texto || 'Elige un flujo con plantilla para ver el mensaje.'}
            <div className="mt-1 text-right text-[10px] text-[#0b3b1e]/60">--:--</div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Vista previa — al enviar se abre WhatsApp con este texto listo.</p>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Orquestador ------------------------------ */
export default function WhatsappClient({ flujos, clientas }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action, fd, after) {
    setBusy(true); setError('');
    const res = await action(fd);
    setBusy(false);
    if (res?.error) setError(res.error);
    else { after?.(); router.refresh(); }
  }

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}

      {/* Enviar */}
      <Enviar flujos={flujos} clientas={clientas} />

      {/* Flujos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Flujos automatizados</h2>
          <button type="button" onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"><Plus size={15} /> Nuevo flujo</button>
        </div>

        {creating && (
          <form action={(fd) => run(guardarFlujo, fd, () => setCreating(false))} className="rounded-xl border border-border bg-card p-4 shadow-card-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-serif text-lg">Nuevo flujo</h3>
              <button type="button" onClick={() => setCreating(false)}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="nombre" required placeholder="Nombre del flujo" className={inputCls} />
              <input name="disparador" placeholder="Disparador (ej. Pedido pagado)" className={inputCls} />
            </div>
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">Crear flujo</button>
            </div>
          </form>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flujos.map((f) => <FlujoCard key={f.id} flujo={f} run={run} busy={busy} />)}
          {flujos.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay flujos.</p>}
        </div>
      </section>
    </div>
  );
}
