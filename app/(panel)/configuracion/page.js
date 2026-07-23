import { PageHeader } from '@/components/panel/ui';
import { getPanelUser, esFundadora } from '@/lib/auth';
import { getConfigTienda, listEquipo, contarFundadoras } from '@/lib/config';
import ConfiguracionClient from '@/components/panel/config/ConfiguracionClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';

export const metadata = { title: 'Configuración · Taluna' };
export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const { ready, config } = await getConfigTienda();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Configuración" subtitle="Ajustes de la tienda, equipo, envíos, pagos e integraciones." />
        <SetupNeeded file="supabase/roles-setup.sql + store-config-setup.sql" />
      </div>
    );
  }

  const [equipo, nFund, fundadora, user] = await Promise.all([
    listEquipo(),
    contarFundadoras(),
    esFundadora(),
    getPanelUser(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Configuración" subtitle="Ajustes de la tienda, equipo, envíos, pagos e integraciones." />
      <ConfiguracionClient
        config={config}
        equipo={equipo.items || []}
        hayFundadora={nFund > 0}
        esFundadora={fundadora}
        miId={user.id}
      />
    </div>
  );
}
