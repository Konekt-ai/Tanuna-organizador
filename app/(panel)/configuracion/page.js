import { PageHeader, ComingSoon } from '@/components/panel/ui';

export const metadata = { title: 'Configuración · Taluna' };

export default function ConfiguracionPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Configuración"
        subtitle="Ajustes generales de la tienda, envíos, pagos e integraciones."
      />
      <ComingSoon
        title="Configuración y Equipo en la Fase 5"
        description="Datos de la tienda, invitación de personal con roles (Fundadora / staff), tarifas de envío, métodos de pago e integraciones."
        phase="Fase 5 · Configuración + Equipo"
      />
    </div>
  );
}
