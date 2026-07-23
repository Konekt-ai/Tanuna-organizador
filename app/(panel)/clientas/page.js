import { PageHeader, ComingSoon } from '@/components/panel/ui';

export const metadata = { title: 'Clientas · Taluna' };

export default function ClientasPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clientas"
        subtitle="Contactos, seguimientos y respuestas pendientes."
      />
      <ComingSoon
        title="El CRM de Clientas llega en la Fase 3"
        description="Gestión de clientas con estatus (compra, espera respuesta, nueva…), canal de origen, seguimientos y respuesta rápida por WhatsApp."
        phase="Fase 3 · Pedidos + Clientas"
      />
    </div>
  );
}
