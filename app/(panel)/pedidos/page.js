import { PageHeader } from '@/components/panel/ui';
import { listPedidos, listClientas } from '@/lib/ventas';
import { listInventario } from '@/lib/inventario';
import { listCombinaciones } from '@/lib/catalog';
import PedidosClient from '@/components/panel/ventas/PedidosClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';

export const metadata = { title: 'Pedidos · Taluna' };
export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const { ready, items: pedidos } = await listPedidos();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Pedidos" subtitle="Ventas en curso, pagos y envíos." />
        <SetupNeeded file="supabase/sales-setup.sql" />
      </div>
    );
  }

  const [clientasRes, inv, combos] = await Promise.all([
    listClientas(),
    listInventario(),
    listCombinaciones(),
  ]);

  // Opciones vendibles: variantes de producto + combinaciones.
  const opciones = [];
  for (const p of inv.items || []) {
    for (const v of p.producto_variantes || []) {
      opciones.push({ value: `var:${v.id}`, label: `${p.nombre} · ${v.color}`, precio: Number(p.precio_base) || 0 });
    }
  }
  for (const c of combos.items || []) {
    opciones.push({
      value: `combo:${c.id}`,
      label: `${c.bolsa?.nombre || 'Bolsa'} + ${c.strap?.nombre || 'Strap'}${c.color ? ` (${c.color})` : ''}`,
      precio: Number(c.precio_final) || 0,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Pedidos"
        subtitle="Ventas en curso, pagos y envíos. Al marcar como enviado se descuenta el inventario."
      />
      <PedidosClient pedidos={pedidos} clientas={clientasRes.items || []} opciones={opciones} />
    </div>
  );
}
