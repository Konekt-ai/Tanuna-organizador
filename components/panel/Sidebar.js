'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import TalunaGlyph from '@/components/TalunaGlyph';
import { signOut } from '@/app/actions';
import { NAV_GROUPS } from './nav';

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

// Contenido del sidebar (marca + navegación + usuaria). Se reutiliza tanto en
// la versión fija de escritorio como en el drawer móvil.
export default function Sidebar({ user, onNavigate, showClose = false }) {
  const pathname = usePathname();
  const email = user?.email ?? '';
  const nombre = user?.nombre ?? (email ? email.split('@')[0] : 'Cuenta');
  const iniciales = user?.iniciales ?? (nombre || 'T').slice(0, 2).toUpperCase();
  const avatarColor = user?.avatarColor ?? 'oklch(0.62 0.14 40)';
  const rol = user?.rol
    ? user.rol === 'fundadora'
      ? 'Fundadora'
      : 'Equipo'
    : 'Cuenta activa';

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="text-accent">
          <TalunaGlyph size={26} />
        </span>
        <div className="leading-none">
          <div className="font-serif text-xl">Taluna</div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Panel
          </div>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Cerrar menú"
            className="ml-auto rounded-md border border-sidebar-border p-1.5 hover:bg-sidebar-accent"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((grp, i) => (
          <div key={grp.group ?? `g${i}`} className="space-y-1">
            {grp.group && (
              <div className="px-3 pb-1 pt-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {grp.group}
              </div>
            )}
            {grp.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                    active
                      ? 'bg-sidebar-primary font-medium text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  ].join(' ')}
                >
                  <Icon size={18} className={active ? '' : 'text-muted-foreground'} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Usuaria */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: avatarColor }}
          >
            {iniciales}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium">{nombre}</div>
            <div className="truncate text-xs text-muted-foreground">{rol}</div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
