import { PageHeader } from '@/components/panel/ui';
import { listCategorias } from '@/lib/catalog';
import CategoriasClient from '@/components/panel/catalogo/CategoriasClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';
import MigrarCatalogo from '@/components/panel/catalogo/MigrarCatalogo';

export const metadata = { title: 'Categorías · Taluna' };
export const dynamic = 'force-dynamic';

export default async function CategoriasPage() {
  const { ready, items } = await listCategorias();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Categorías"
        subtitle="Estructura de navegación del catálogo."
      />
      {!ready ? (
        <SetupNeeded />
      ) : (
        <>
          {items.length === 0 && <MigrarCatalogo />}
          <CategoriasClient items={items} />
        </>
      )}
    </div>
  );
}
