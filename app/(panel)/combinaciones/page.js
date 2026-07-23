import { PageHeader } from '@/components/panel/ui';
import { listCombinaciones, listProductosSimple } from '@/lib/catalog';
import CombinacionesClient from '@/components/panel/catalogo/CombinacionesClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';
import MigrarCatalogo from '@/components/panel/catalogo/MigrarCatalogo';

export const metadata = { title: 'Arma tu Taluna · Taluna' };
export const dynamic = 'force-dynamic';

export default async function CombinacionesPage() {
  const { ready, items } = await listCombinaciones();
  const [bolsas, straps] = ready
    ? await Promise.all([listProductosSimple('bolsa'), listProductosSimple('strap')])
    : [[], []];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Arma tu Taluna"
        subtitle="Bolsa + color + strap + largo. Esta estructura define lo que la clienta puede armar."
      />
      {!ready ? (
        <SetupNeeded />
      ) : (
        <>
          {items.length === 0 && bolsas.length === 0 && <MigrarCatalogo />}
          <CombinacionesClient items={items} bolsas={bolsas} straps={straps} />
        </>
      )}
    </div>
  );
}
