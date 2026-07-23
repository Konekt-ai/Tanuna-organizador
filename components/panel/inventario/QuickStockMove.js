'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { registrarMovimiento } from '@/app/(panel)/inventario/actions';

const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';

const MOTIVOS_MAS = ['Nueva producción', 'Devolución de clienta', 'Reposición de proveedor', 'Ajuste por conteo'];
const MOTIVOS_MENOS = ['Venta fuera de tienda', 'Daño o merma', 'Muestras / showroom', 'Ajuste por conteo'];

export default function QuickStockMove({ variantes }) {
  const router = useRouter();
  const [direccion, setDireccion] = useState('aumentar');
  const [varianteId, setVarianteId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const variante = variantes.find((v) => v.id === varianteId);
  const nCant = Math.abs(Math.trunc(Number(cantidad) || 0));
  const delta = direccion === 'disminuir' ? -nCant : nCant;
  const resultado = variante ? variante.stock + delta : null;
  const invalido = !variante || nCant <= 0 || (resultado !== null && resultado < 0);
  const motivos = direccion === 'disminuir' ? MOTIVOS_MENOS : MOTIVOS_MAS;

  async function onSubmit(formData) {
    setBusy(true);
    setError('');
    setOk(false);
    const res = await registrarMovimiento(formData);
    setBusy(false);
    if (res?.error) setError(res.error);
    else {
      setOk(true);
      setCantidad('');
      router.refresh();
    }
  }

  return (
    <form action={onSubmit} className="rounded-xl border border-border bg-card p-6 shadow-card-sm">
      <h3 className="font-serif text-lg">Registrar movimiento de piezas</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Aumenta o descuenta piezas con motivo. Verás el resumen antes de guardar.
      </p>

      {/* Dirección */}
      <input type="hidden" name="direccion" value={direccion} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { k: 'aumentar', label: 'Aumentar piezas', sub: 'Producción, devolución…', icon: Plus },
          { k: 'disminuir', label: 'Disminuir piezas', sub: 'Venta fuera de tienda, daño…', icon: Minus },
        ].map((o) => {
          const active = direccion === o.k;
          const Icon = o.icon;
          return (
            <button
              key={o.k}
              type="button"
              onClick={() => setDireccion(o.k)}
              className={`flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition ${
                active ? 'border-accent bg-accent/10' : 'border-border bg-card hover:bg-secondary'
              }`}
            >
              <Icon size={16} className={active ? 'text-accent' : 'text-muted-foreground'} />
              <span>
                <span className="block font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Producto y variante</span>
          <select name="variante_id" value={varianteId} onChange={(e) => setVarianteId(e.target.value)} required className={inputCls}>
            <option value="">Elige un producto…</option>
            {variantes.map((v) => (
              <option key={v.id} value={v.id}>{v.label} (stock {v.stock})</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">¿Cuántas piezas?</span>
          <input name="cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Motivo</span>
          <select name="motivo" className={inputCls} defaultValue="">
            <option value="">Elige un motivo…</option>
            {motivos.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota (opcional)</span>
          <input name="nota" placeholder="Ej. Entregado en showroom…" className={inputCls} />
        </label>
      </div>

      {/* Vista previa */}
      {variante && nCant > 0 && (
        <div className={`mt-4 rounded-lg border px-4 py-2 text-sm ${resultado < 0 ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-secondary/40'}`}>
          {variante.label}: <b>{variante.stock}</b> → <b>{resultado}</b>{' '}
          <span className={delta >= 0 ? 'text-success' : 'text-destructive'}>({delta >= 0 ? '+' : ''}{delta})</span>
          {resultado < 0 && ' · no hay suficiente stock'}
        </div>
      )}

      {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {ok && <div className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">Movimiento registrado.</div>}

      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={busy || invalido} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? 'Guardando…' : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  );
}
