import { PageHeader, StatTile, Card, Badge } from '@/components/panel/ui';
import { money } from '@/lib/catalog';
import {
  listInventario,
  inventarioKpis,
  listVariantesParaMover,
  listMovimientos,
} from '@/lib/inventario';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';
import QuickStockMove from '@/components/panel/inventario/QuickStockMove';

export const metadata = { title: 'Inventario · Taluna' };
export const dynamic = 'force-dynamic';

const TIPO_TONE = { entrada: 'success', salida: 'danger', ajuste: 'neutral' };

function fecha(d) {
  try {
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default async function InventarioPage() {
  const { ready, items } = await listInventario();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Inventario" subtitle="Piezas disponibles por producto y variante." />
        <SetupNeeded file="el esquema base + supabase/inventory-setup.sql" />
      </div>
    );
  }

  const [kpis, variantes, mov] = await Promise.all([
    inventarioKpis(),
    listVariantesParaMover(),
    listMovimientos({ limit: 30 }),
  ]);

  const invReady = mov.ready; // ¿existe la tabla de movimientos?

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Inventario"
        subtitle="Piezas disponibles por producto. Cada cambio te muestra qué se modifica antes de guardar."
      />

      {!invReady && <SetupNeeded file="supabase/inventory-setup.sql" />}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Piezas totales" value={kpis.piezas_totales} />
          <StatTile label="Valor de inventario" value={money(kpis.valor_inventario)} />
          <StatTile label="Bajo stock" value={kpis.bajo_stock} sub="5 piezas o menos" />
          <StatTile label="Agotados" value={kpis.agotados} />
        </div>
      )}

      {/* Registrar movimiento */}
      {invReady && variantes.length > 0 && <QuickStockMove variantes={variantes} />}

      {/* Tabla de inventario */}
      <Card title="Piezas por producto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 text-right font-medium">Variantes</th>
                <th className="px-3 py-2 text-right font-medium">Piezas</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.categoria?.nombre || '—'}</td>
                  <td className="px-3 py-2 text-right">{p.num_variantes}</td>
                  <td className="px-3 py-2 text-right font-medium">{p.piezas}</td>
                  <td className="px-3 py-2">
                    <Badge tone={p.piezas > 0 ? 'success' : 'danger'}>{p.piezas > 0 ? 'disponible' : 'agotado'}</Badge>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sin productos aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movimientos recientes */}
      {invReady && (
        <Card title="Movimientos recientes" action={<span className="text-sm text-muted-foreground">{mov.items.length}</span>}>
          {mov.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay movimientos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {mov.items.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{fecha(m.created_at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{m.producto}</span>
                    <span className="text-muted-foreground"> · {m.color}</span>
                    {m.motivo && <span className="block text-xs text-muted-foreground">{m.motivo}</span>}
                  </span>
                  <Badge tone={TIPO_TONE[m.tipo] || 'neutral'}>{m.tipo}</Badge>
                  <span className={`w-12 text-right font-medium ${m.delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {m.delta >= 0 ? '+' : ''}{m.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
