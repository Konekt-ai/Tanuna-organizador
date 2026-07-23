import Link from 'next/link';
import { PageHeader, Card, StatTile, Badge } from '@/components/panel/ui';
import { money } from '@/lib/catalog';
import { reporteCompleto } from '@/lib/reportes';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';

export const metadata = { title: 'Reportes · Taluna' };
export const dynamic = 'force-dynamic';

const RANGOS = [
  { k: 'hoy', label: 'Hoy' },
  { k: 'semana', label: 'Esta semana' },
  { k: 'mes', label: 'Este mes' },
  { k: 'todo', label: 'Todo' },
];

export default async function ReportesPage({ searchParams }) {
  const rango = RANGOS.some((r) => r.k === searchParams?.rango) ? searchParams.rango : 'mes';
  const rep = await reporteCompleto(rango, new Date());

  if (!rep.ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Reportes" subtitle="Información para tomar decisiones sobre ventas, productos e inventario." />
        <SetupNeeded file="supabase/sales-setup.sql" />
      </div>
    );
  }

  const maxDia = Math.max(1, ...rep.por_dia.map((d) => d.monto));
  const hayVentas = rep.por_dia.some((d) => d.monto > 0) || rep.kpis.pedidos > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Reportes" subtitle="Información para tomar decisiones sobre ventas, productos e inventario." />

      {/* Filtro de rango */}
      <div className="flex flex-wrap gap-2">
        {RANGOS.map((r) => (
          <Link
            key={r.k}
            href={`/reportes?rango=${r.k}`}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              rango === r.k ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-secondary'
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* ¿Cuánto vendimos? */}
      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">¿Cuánto vendimos?</h2>
          <p className="text-sm text-muted-foreground">Resumen de ventas del periodo.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Ventas pagadas" value={money(rep.kpis.ventas)} />
          <StatTile label="Pedidos" value={rep.kpis.pedidos} />
          <StatTile label="Ticket promedio" value={money(rep.kpis.ticket)} sub="por pedido pagado" />
          <StatTile label="Por cobrar" value={money(rep.kpis.por_cobrar)} sub="pendiente de pago" />
        </div>
        <Card title="Ventas por día · últimos 7 días">
          {hayVentas ? (
            <div className="flex h-56 items-end gap-3">
              {rep.por_dia.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[0.65rem] text-muted-foreground">{d.monto ? money(d.monto) : ''}</span>
                  <div
                    className="w-full rounded-t bg-accent"
                    style={{ height: `${Math.max(2, (d.monto / maxDia) * 100)}%` }}
                    title={money(d.monto)}
                  />
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay ventas registradas en este periodo.</p>
          )}
        </Card>
      </section>

      {/* ¿Qué se está vendiendo? */}
      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">¿Qué se está vendiendo?</h2>
          <p className="text-sm text-muted-foreground">Bolsas, straps y combinaciones más elegidas.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Bolsas más vendidas">
            <RankingList items={rep.bolsas_top} conIngreso />
          </Card>
          <Card title="Straps más vendidos">
            <RankingList items={rep.straps_top} />
          </Card>
          <Card title="Combinaciones más elegidas" className="lg:col-span-2">
            {rep.combos_top.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Bolsa</th>
                      <th className="px-3 py-2 font-medium">Color</th>
                      <th className="px-3 py-2 font-medium">Strap</th>
                      <th className="px-3 py-2 text-right font-medium">Elegidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rep.combos_top.map((c, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium">{c.bolsa}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.color}</td>
                        <td className="px-3 py-2">{c.strap}</td>
                        <td className="px-3 py-2 text-right">{c.elegidas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
            )}
          </Card>
        </div>
      </section>

      {/* ¿Qué debemos reponer? */}
      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">¿Qué debemos reponer?</h2>
          <p className="text-sm text-muted-foreground">Piezas agotadas o por agotarse.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReponerCard titulo="Agotados" tono="danger" count={rep.reponer.agotados.length} lista={rep.reponer.agotados} nota="Sin piezas disponibles." />
          <ReponerCard titulo="Bajo inventario" tono="warning" count={rep.reponer.bajo.length} lista={rep.reponer.bajo} nota="5 piezas o menos." />
          <ReponerCard titulo="Sin movimiento" tono="neutral" count={rep.reponer.sin_movimiento} nota="Más de 60 días sin movimientos. Considera promoción o combos." />
        </div>
      </section>

      {/* ¿De dónde llegan las ventas? */}
      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">¿De dónde llegan las ventas?</h2>
          <p className="text-sm text-muted-foreground">Canales por los que llegaron tus clientas.</p>
        </div>
        {rep.canales.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {rep.canales.map((c) => (
              <div key={c.canal} className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
                <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{c.canal}</div>
                <div className="mt-2 font-serif text-3xl">{c.num}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.pct}% de los pedidos</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay pedidos con canal de origen.</p>
        )}
      </section>
    </div>
  );
}

function RankingList({ items, conIngreso }) {
  if (!items?.length) return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos todavía.</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map((it, i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{i + 1}.</span>
            <span className="truncate font-medium">{it.nombre}</span>
          </span>
          <span className="shrink-0 text-muted-foreground">
            {it.unidades} {it.unidades === 1 ? 'vendida' : 'vendidas'}
            {conIngreso && it.ingreso ? ` · ${money(it.ingreso)}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReponerCard({ titulo, tono, count, lista, nota }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">{titulo}</h3>
        <Badge tone={tono}>{count}</Badge>
      </div>
      {lista?.length ? (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {lista.slice(0, 4).map((x, i) => <li key={i} className="truncate">{x}</li>)}
          {lista.length > 4 && <li className="text-xs">y {lista.length - 4} más…</li>}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{nota}</p>
      )}
    </div>
  );
}
