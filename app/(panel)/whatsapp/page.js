import { PageHeader, StatTile } from '@/components/panel/ui';
import { listFlujos, waKpis } from '@/lib/whatsapp';
import { listClientas } from '@/lib/ventas';
import WhatsappClient from '@/components/panel/whatsapp/WhatsappClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';

export const metadata = { title: 'WhatsApp · Taluna' };
export const dynamic = 'force-dynamic';

export default async function WhatsappPage() {
  const { ready, items: flujos } = await listFlujos();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="WhatsApp Business" subtitle="Flujos automatizados, plantillas y envío." />
        <SetupNeeded file="supabase/ventas-setup.sql + whatsapp-setup.sql" />
      </div>
    );
  }

  const [kpis, clientasRes] = await Promise.all([waKpis(), listClientas()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="WhatsApp Business"
        subtitle="Flujos automatizados, plantillas por tono y envío por WhatsApp (wa.me)."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Flujos activos" value={kpis.flujos_activos} sub={`de ${kpis.flujos_total}`} />
        <StatTile label="Mensajes hoy" value={kpis.mensajes_hoy} />
        <StatTile label="Mensajes enviados" value={kpis.mensajes_total} sub="total" />
        <StatTile label="Envío automático" value="wa.me" sub="API de Meta: próximamente" />
      </div>

      <WhatsappClient flujos={flujos} clientas={clientasRes.items || []} />
    </div>
  );
}
