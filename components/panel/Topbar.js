'use client';

import { Menu, Bell, Compass, SlidersHorizontal } from 'lucide-react';
import TalunaGlyph from '@/components/TalunaGlyph';
import ThemeToggle from './ThemeToggle';

// Barra superior del panel: menú móvil, marca en móvil y acciones a la derecha.
// Recorrido guiado / Notificaciones / Apariencia son visuales por ahora
// (se conectan en fases posteriores); el toggle de tema sí funciona.
export default function Topbar({ user, onMenu }) {
  const email = user?.email ?? '';
  const nombre = user?.nombre ?? (email ? email.split('@')[0] : 'Cuenta');
  const iniciales = user?.iniciales ?? (nombre || 'T').slice(0, 2).toUpperCase();
  const avatarColor = user?.avatarColor ?? 'oklch(0.62 0.14 40)';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        {/* Menú móvil */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú"
          className="rounded-md border border-border bg-card p-2 hover:bg-secondary md:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Marca en móvil */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-accent">
            <TalunaGlyph size={22} />
          </span>
          <span className="font-serif text-lg">Taluna</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Usuaria (compacta) */}
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: avatarColor }}
            >
              {iniciales}
            </span>
            <span className="text-sm">{nombre}</span>
          </div>

          {/* Recorrido guiado */}
          <button
            type="button"
            className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-accent hover:bg-secondary sm:inline-flex"
          >
            <Compass size={16} className="text-accent" />
            <span className="hidden sm:inline">Recorrido guiado</span>
          </button>

          {/* Notificaciones */}
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative rounded-md border border-border bg-card p-2 hover:bg-secondary"
          >
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              6
            </span>
          </button>

          {/* Tema */}
          <ThemeToggle />

          {/* Apariencia */}
          <button
            type="button"
            aria-label="Apariencia"
            className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary sm:inline-flex"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Apariencia</span>
          </button>
        </div>
      </div>
    </header>
  );
}
