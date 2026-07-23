import { PageHeader } from '@/components/panel/ui';
import { listProductos, listCategorias } from '@/lib/catalog';
import ProductosClient from '@/components/panel/catalogo/ProductosClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';
import MigrarCatalogo from '@/components/panel/catalogo/MigrarCatalogo';
import OrganizerCard from '@/components/panel/OrganizerCard';

export const metadata = { title: 'Productos · Taluna' };
export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  const { ready, items } = await listProductos();
  const cats = ready ? await listCategorias() : { items: [] };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Productos"
        subtitle="Catálogo con variantes por color, imágenes y estado de publicación."
      />
      {!ready ? (
        <SetupNeeded />
      ) : items.length === 0 ? (
        <>
          <MigrarCatalogo />
          <ProductosClient items={items} categorias={cats.items} />
          <OrganizerCard />
        </>
      ) : (
        <ProductosClient items={items} categorias={cats.items} />
      )}
    </div>
  );
}
