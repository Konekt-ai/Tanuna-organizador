import { PageHeader, ComingSoon } from '@/components/panel/ui';

export const metadata = { title: 'Pedidos · Taluna' };

export default function PedidosPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pedidos"
        subtitle="Ventas en curso, pagos y envíos, con detalle por pedido."
      />
      <ComingSoon
        title="Pedidos llega en la Fase 3"
        description="Lista de pedidos con folio T-####, estados de pago y envío, y descuento automático de inventario al marcar como enviado. Necesita las tablas de catálogo e inventario (Fases 1 y 2)."
        phase="Fase 3 · Pedidos + Clientas"
      />
    </div>
  );
}
