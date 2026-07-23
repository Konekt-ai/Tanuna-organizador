'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/panel/ui';
import {
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
} from '@/app/(panel)/categorias/actions';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';

function CategoriaFormFields({ defaults = {} }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nombre">
        <input name="nombre" defaultValue={defaults.nombre} required className={inputCls} placeholder="Ej. Bolsas" />
      </Field>
      <Field label="Slug (URL)">
        <input name="slug" defaultValue={defaults.slug} className={inputCls} placeholder="se genera solo" />
      </Field>
      <Field label="Estado">
        <select name="estado" defaultValue={defaults.estado || 'activo'} className={inputCls}>
          <option value="activo">activo</option>
          <option value="inactivo">inactivo</option>
        </select>
      </Field>
    </div>
  );
}

export default function CategoriasClient({ items }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action, formData, after) {
    setBusy(true);
    setError('');
    const res = await action(formData);
    setBusy(false);
    if (res?.error) setError(res.error);
    else after?.();
  }

  return (
    <div className="space-y-6">
      {/* Encabezado + acción */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'categoría' : 'categorías'}
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form de creación */}
      {creating && (
        <form
          action={(fd) => run(crearCategoria, fd, () => setCreating(false))}
          className="rounded-xl border border-border bg-card p-5 shadow-card-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-lg">Nueva categoría</h3>
            <button type="button" onClick={() => setCreating(false)} aria-label="Cerrar">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
          <CategoriaFormFields />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Grid de categorías */}
      {items.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
          Aún no hay categorías. Crea la primera o migra tu catálogo del Organizador.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card-sm">
              {editingId === c.id ? (
                <form action={(fd) => run(editarCategoria, fd, () => setEditingId(null))} className="p-5">
                  <input type="hidden" name="id" value={c.id} />
                  <CategoriaFormFields defaults={c} />
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={busy} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                      Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div
                    className="flex aspect-[16/9] items-end p-4"
                    style={{
                      background:
                        'linear-gradient(135deg, oklch(0.925 0.022 78), oklch(0.68 0.075 62))',
                    }}
                  >
                    <div>
                      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/80">
                        Orden {c.orden}
                      </div>
                      <div className="font-serif text-2xl text-white drop-shadow">{c.nombre}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">/{c.slug}</span>
                      <Badge tone={c.estado === 'activo' ? 'success' : 'neutral'}>{c.estado}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {c.num_productos} {c.num_productos === 1 ? 'producto' : 'productos'}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setCreating(false);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
                      >
                        <Pencil size={15} /> Editar
                      </button>
                      <form
                        action={(fd) => {
                          if (confirm(`¿Eliminar la categoría "${c.nombre}"?`)) run(eliminarCategoria, fd);
                        }}
                      >
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          aria-label="Eliminar"
                          className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
