import { PageHeader, ComingSoon } from '@/components/panel/ui';

export const metadata = { title: 'WhatsApp · Taluna' };

export default function WhatsappPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="WhatsApp Business"
        subtitle="Flujos automatizados, plantillas y simulación de envío."
      />
      <ComingSoon
        title="WhatsApp llega en la Fase 6"
        description="Flujos y plantillas por tono, y envío por link wa.me desde el primer día. El envío automático con acuses (API de Meta) se agrega después, sin rehacer la pantalla."
        phase="Fase 6 · WhatsApp"
      />
    </div>
  );
}
