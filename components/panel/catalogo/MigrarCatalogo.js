'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DownloadCloud } from 'lucide-react';

// Control para migrar el catálogo del Organizador a las tablas nuevas.
// Primero corre un DRY-RUN (no escribe), muestra el resumen, y solo tras
// confirmar aplica los cambios. No borra el documento original.
export default function MigrarCatalogo() {
  const router = useRouter();
  const [estado, setEstado] = useState('idle'); // idle | dry | aplicando | listo | error
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  async function llamar(apply) {
    setError('');
    setEstado(apply ? 'aplicando' : 'dry');
    try {
      const res = await fetch('/api/catalog/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en la migración');
      setResumen(json.resumen);
      setEstado(apply ? 'listo' : 'dry-listo');
      if (apply) router.refresh();
    } catch (e) {
      setError(e.message);
      setEstado('error');
    }
  }

  const R = resumen;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <DownloadCloud size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg">Traer el catálogo del Organizador</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Copia bolsas, straps, cinturones y combinaciones que ya capturaste al
            catálogo nuevo. Primero te muestra un resumen; no borra nada.
          </p>

          {R && (
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              <span>Categorías: <b>{R.categorias}</b></span>
              <span>Productos: <b>{R.productos}</b></span>
              <span>Variantes: <b>{R.variantes}</b></span>
              <span>Imágenes: <b>{R.imagenes}</b></span>
              <span>Combinaciones: <b>{R.combinaciones}</b></span>
            </div>
          )}
          {R?.avisos?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-warning-foreground">
              {R.avisos.slice(0, 5).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
          {error && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {estado === 'listo' && (
            <div className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              ¡Listo! El catálogo se copió a las tablas nuevas.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => llamar(false)}
              disabled={estado === 'dry' || estado === 'aplicando'}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60"
            >
              {estado === 'dry' ? 'Revisando…' : 'Ver qué se copiaría'}
            </button>
            {(estado === 'dry-listo' || estado === 'listo') && (
              <button
                type="button"
                onClick={() => llamar(true)}
                disabled={estado === 'aplicando'}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {estado === 'aplicando' ? 'Copiando…' : 'Aplicar migración'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
