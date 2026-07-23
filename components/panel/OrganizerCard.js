import { ArrowUpRight, Sparkles } from 'lucide-react';

// Tarjeta que enlaza al Organizador de catálogo actual (public/estudio.html),
// que YA funciona y guarda en la nube. Se muestra en las secciones de Catálogo
// mientras se reconstruyen como pantallas nativas (Fase 1).
export default function OrganizerCard() {
  return (
    <a
      href="/estudio.html"
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card-sm transition hover:border-accent"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Sparkles size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">Abrir el Organizador de catálogo</div>
        <p className="text-sm text-muted-foreground">
          Tu herramienta actual para bolsas, straps, combinaciones y fotos. Ya
          funciona y guarda en la nube.
        </p>
      </div>
      <ArrowUpRight
        size={20}
        className="text-muted-foreground transition group-hover:text-accent"
      />
    </a>
  );
}
