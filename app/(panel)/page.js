import Link from 'next/link';
import {
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { getPanelUser } from '@/lib/auth';
import { StatTile, Card } from '@/components/panel/ui';
import OrganizerCard from '@/components/panel/OrganizerCard';
import { money, catalogCounts } from '@/lib/catalog';
import { inventarioKpis } from '@/lib/inventario';
import { ventasResumen, contarClientas } from '@/lib/ventas';

export const dynamic = 'force-dynamic';

const ACCESOS = [
  { label: 'Pedidos', href: '/pedidos', icon: ShoppingBag, desc: 'Ventas y envíos' },
  { label: 'Clientas', href: '/clientas', icon: Users, desc: 'Contactos y seguimiento' },
  { label: 'Productos', href: '/productos', icon: Package, desc: 'Catálogo y variantes' },
  { label: 'Reportes', href: '/reportes', icon: BarChart3, desc: 'Ventas y métricas' },
];

export default async function InicioPage() {
  const user = await getPanelUser();
  const nombre = user.nombre || 'de nuevo';

  // KPIs reales (cada uno es null si aún no se corre su SQL).
  const [ventas, inv, clientas, cat] = await Promise.all([
    ventasResumen(),
    inventarioKpis(),
    contarClientas(),
    catalogCounts(),
  ]);
  const piezas = inv?.piezas_totales;
  const productos = cat ? cat.bolsas + cat.straps + cat.cinturones : null;
  const dash = (v) => (v === null || v === undefined ? '—' : v);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Saludo */}
      <div>
        <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Tu espacio de trabajo
        </div>
        <h1 className="mt-1 font-serif text-3xl md:text-4xl">
          Bienvenida de vuelta, <em className="italic text-accent">{nombre}</em>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo tu negocio de Taluna en un solo lugar. Empieza por organizar tu
          catálogo; las métricas se activan cuando conectes pedidos.
        </p>
      </div>

      {/* KPIs reales (— hasta que existan datos) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Ventas pagadas"
          value={ventas ? money(ventas.ventas_pagadas) : '—'}
          sub={ventas ? `${ventas.pedidos} pedidos` : 'Se activa con Pedidos'}
        />
        <StatTile
          label="Por enviar"
          value={dash(ventas?.por_enviar)}
          sub={ventas ? 'pedidos pendientes' : 'Se activa con Pedidos'}
        />
        <StatTile
          label="Clientas"
          value={dash(clientas)}
          sub={clientas === null ? 'Se activa con el CRM' : 'registradas'}
        />
        <StatTile
          label="Piezas en inventario"
          value={dash(piezas)}
          sub={productos != null ? `${productos} productos` : 'Se activa con Catálogo'}
        />
      </div>

      {/* Organizador actual */}
      <div className="space-y-3">
        <h2 className="font-serif text-xl">Empieza aquí</h2>
        <OrganizerCard />
      </div>

      {/* Accesos rápidos */}
      <div className="space-y-3">
        <h2 className="font-serif text-xl">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ACCESOS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="group rounded-xl border border-border bg-card p-5 shadow-card-sm transition hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <Icon size={18} />
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-muted-foreground transition group-hover:text-accent"
                  />
                </div>
                <div className="mt-3 font-medium">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Nota de estado */}
      <Card title="Estado del panel">
        <p className="text-sm text-muted-foreground">
          Estás viendo la <strong className="text-foreground">Fase 0</strong> del
          panel nuevo: el diseño completo y la navegación ya funcionan. Las
          secciones de ventas, inventario y reportes se irán conectando a datos
          reales por fases. Mientras tanto, el Organizador de catálogo sigue
          100% funcional.
        </p>
      </Card>
    </div>
  );
}
