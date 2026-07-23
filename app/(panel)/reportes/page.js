import { PageHeader, ComingSoon } from '@/components/panel/ui';

export const metadata = { title: 'Reportes · Taluna' };

export default function ReportesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reportes"
        subtitle="Información para tomar decisiones sobre ventas, productos e inventario."
      />
      <ComingSoon
        title="Reportes llega en la Fase 4"
        description="Ventas por día, productos y combinaciones más vendidas, qué reponer y canales de venta — sobre datos reales. Necesita que Pedidos ya genere información (Fase 3)."
        phase="Fase 4 · Reportes"
      />
    </div>
  );
}
