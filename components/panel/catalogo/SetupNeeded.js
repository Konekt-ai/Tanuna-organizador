import { Database } from 'lucide-react';

// Estado que se muestra cuando aún no se corrió el SQL del catálogo en Supabase.
export default function SetupNeeded({ file = 'supabase/catalog-setup.sql' }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 shadow-card-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Database size={20} />
        </span>
        <div>
          <h3 className="font-serif text-xl">Falta preparar la base de datos</h3>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Para activar esta sección corre una vez el script{' '}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{file}</code>{' '}
            en Supabase → SQL Editor → New query. Es idempotente y no afecta al
            Organizador actual.
          </p>
        </div>
      </div>
    </div>
  );
}
