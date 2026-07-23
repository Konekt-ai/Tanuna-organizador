'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Users, Truck, CreditCard, Plug, ShieldCheck, Lock } from 'lucide-react';
import { Badge, Card } from '@/components/panel/ui';
import {
  guardarTienda,
  cambiarRol,
  cambiarActivo,
  reclamarFundadora,
} from '@/app/(panel)/configuracion/actions';

const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-60';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Avatar({ nombre, iniciales }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'oklch(0.62 0.14 40)' }}>
      {iniciales || (nombre || '?').slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function ConfiguracionClient({ config, equipo, hayFundadora, esFundadora, miId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const puedeEditar = esFundadora;
  const c = config || {};
  const envios = c.envios || {};

  async function run(action, fd, msg) {
    setBusy(true); setError(''); setOk('');
    const res = await action(fd);
    setBusy(false);
    if (res?.error) setError(res.error);
    else { setOk(msg || 'Guardado.'); router.refresh(); }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
      {ok && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">{ok}</div>}

      {/* Arranque: reclamar fundadora si aún no hay ninguna */}
      {!hayFundadora && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-5 shadow-card-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/20 text-accent"><ShieldCheck size={20} /></span>
            <div className="flex-1">
              <h3 className="font-serif text-lg">Aún no hay Fundadora asignada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                La Fundadora es la única que puede editar la configuración e invitar equipo. Reclama el rol para tu cuenta (solo funciona mientras no exista ninguna).
              </p>
              <form action={() => run(reclamarFundadora, new FormData(), 'Ahora eres Fundadora.')} className="mt-3">
                <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  Hacerme Fundadora
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {hayFundadora && !puedeEditar && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm text-muted-foreground">
          <Lock size={15} /> Modo lectura — solo la Fundadora puede editar la configuración y el equipo.
        </div>
      )}

      {/* Tienda */}
      <Card title={<span className="flex items-center gap-2"><Store size={18} className="text-accent" /> Tienda</span>}>
        <form action={(fd) => run(guardarTienda, fd, 'Datos de la tienda guardados.')} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre de la tienda"><input name="nombre_tienda" defaultValue={c.nombre_tienda || ''} disabled={!puedeEditar} className={inputCls} /></Field>
          <Field label="Meta mensual (MXN)"><input name="meta_mensual" type="number" defaultValue={c.meta_mensual ?? 0} disabled={!puedeEditar} className={inputCls} /></Field>
          <Field label="Teléfono"><input name="telefono" defaultValue={c.telefono || ''} disabled={!puedeEditar} className={inputCls} /></Field>
          <Field label="Correo"><input name="correo" type="email" defaultValue={c.correo || ''} disabled={!puedeEditar} className={inputCls} /></Field>
          <Field label="WhatsApp (número)"><input name="whatsapp_numero" defaultValue={c.whatsapp_numero || ''} placeholder="+52 55…" disabled={!puedeEditar} className={inputCls} /></Field>
          <Field label="Instagram"><input name="instagram" defaultValue={c.instagram || ''} placeholder="@taluna.mx" disabled={!puedeEditar} className={inputCls} /></Field>
          <div className="sm:col-span-2"><Field label="Dirección"><input name="direccion" defaultValue={c.direccion || ''} disabled={!puedeEditar} className={inputCls} /></Field></div>
          {puedeEditar && (
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">Guardar tienda</button>
            </div>
          )}
        </form>
      </Card>

      {/* Envíos */}
      <Card title={<span className="flex items-center gap-2"><Truck size={18} className="text-accent" /> Envíos</span>}>
        <form action={(fd) => run(guardarTienda, fd, 'Envíos guardados.')} className="grid gap-3 sm:grid-cols-2">
          {/* Reusa guardarTienda: mantiene el resto de campos con sus valores actuales */}
          <input type="hidden" name="nombre_tienda" value={c.nombre_tienda || ''} />
          <input type="hidden" name="meta_mensual" value={c.meta_mensual ?? 0} />
          <Field label="Costo de envío estándar (MXN)"><input name="envio_costo" type="number" defaultValue={envios.costo ?? 0} disabled={!puedeEditar} className={inputCls} /></Field>
          <Field label="Envío gratis desde (MXN)"><input name="envio_gratis_desde" type="number" defaultValue={envios.gratis_desde ?? 0} disabled={!puedeEditar} className={inputCls} /></Field>
          {puedeEditar && (
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary">Guardar envíos</button>
            </div>
          )}
        </form>
      </Card>

      {/* Equipo */}
      <Card title={<span className="flex items-center gap-2"><Users size={18} className="text-accent" /> Equipo</span>}>
        <div className="divide-y divide-border">
          {equipo.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar nombre={m.nombre} iniciales={m.iniciales} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.nombre || m.email || 'Cuenta'} {m.id === miId && <span className="text-xs text-muted-foreground">(tú)</span>}</div>
                {m.email && <div className="truncate text-xs text-muted-foreground">{m.email}</div>}
              </div>
              {!m.activo && <Badge tone="danger">inactiva</Badge>}
              {puedeEditar ? (
                <div className="flex items-center gap-2">
                  <form action={(fd) => run(cambiarRol, fd, 'Rol actualizado.')}>
                    <input type="hidden" name="id" value={m.id} />
                    <select name="rol" defaultValue={m.rol} onChange={(e) => e.target.form.requestSubmit()} className="rounded-lg border border-input bg-background px-2 py-1 text-sm">
                      <option value="fundadora">Fundadora</option>
                      <option value="staff">Equipo</option>
                    </select>
                  </form>
                  <form action={(fd) => run(cambiarActivo, fd, 'Cuenta actualizada.')}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="activo" value={(!m.activo).toString()} />
                    <button type="submit" className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary">{m.activo ? 'Desactivar' : 'Activar'}</button>
                  </form>
                </div>
              ) : (
                <Badge tone={m.rol === 'fundadora' ? 'accent' : 'neutral'}>{m.rol === 'fundadora' ? 'Fundadora' : 'Equipo'}</Badge>
              )}
            </div>
          ))}
          {equipo.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Sin miembros aún.</p>}
        </div>
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Para agregar a alguien al equipo, crea su cuenta en Supabase (Authentication → Users); aparecerá aquí como Equipo y podrás ajustar su rol.
        </p>
      </Card>

      {/* Pagos e Integraciones (requieren cuentas externas) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><CreditCard size={18} className="text-accent" /> Pagos</span>}>
          <p className="text-sm text-muted-foreground">Cobros con Stripe o Mercado Pago (checkout hospedado). Se conecta en una fase posterior; requiere cuenta de comercio.</p>
          <div className="mt-3"><Badge tone="neutral">Próximamente</Badge></div>
        </Card>
        <Card title={<span className="flex items-center gap-2"><Plug size={18} className="text-accent" /> Integraciones</span>}>
          <p className="text-sm text-muted-foreground">WhatsApp Business API, Instagram Shopping y analítica. Requieren aprobación de las plataformas.</p>
          <div className="mt-3"><Badge tone="neutral">Próximamente</Badge></div>
        </Card>
      </div>
    </div>
  );
}
