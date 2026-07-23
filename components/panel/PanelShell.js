'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Marco del panel: sidebar fija en escritorio, drawer en móvil, topbar y main.
export default function PanelShell({ user, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[16rem_1fr] lg:grid-cols-[18rem_1fr]">
      {/* Sidebar escritorio */}
      <aside className="hidden border-r border-sidebar-border md:sticky md:top-0 md:block md:h-[100dvh]">
        <Sidebar user={user} />
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-sidebar-border shadow-card">
            <Sidebar user={user} showClose onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Columna principal */}
      <div className="flex min-h-[100dvh] flex-col">
        <Topbar user={user} onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
