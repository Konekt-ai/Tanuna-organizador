import { PageHeader } from '@/components/panel/ui';
import { listClientas, clientasNecesitanAtencion } from '@/lib/ventas';
import ClientasClient from '@/components/panel/ventas/ClientasClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';

export const metadata = { title: 'Clientas · Taluna' };
export const dynamic = 'force-dynamic';

export default async function ClientasPage() {
  const { ready, items } = await listClientas();
  const atencion = ready ? clientasNecesitanAtencion(items) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Clientas" subtitle="Contactos, seguimientos y respuestas pendientes." />
      {!ready ? (
        <SetupNeeded file="supabase/ventas-setup.sql" />
      ) : (
        <ClientasClient items={items} atencion={atencion} />
      )}
    </div>
  );
}
