import { PageHeader } from '@/components/panel/ui';
import { listProductos, listCategorias } from '@/lib/catalog';
import ProductosClient from '@/components/panel/catalogo/ProductosClient';
import SetupNeeded from '@/components/panel/catalogo/SetupNeeded';

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
        <SetupNeeded file="el esquema base (products / categories)" />
      ) : (
        <ProductosClient items={items} categorias={cats.items} />
      )}
    </div>
  );
}
