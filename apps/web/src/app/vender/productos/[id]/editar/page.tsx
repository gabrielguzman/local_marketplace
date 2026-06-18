import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { CategoryDto, ProductDetailDto } from '@marketplace/shared';
import { ProductForm, type CategoryOption } from '@/components/product-form';
import { VariantManager } from '@/components/variant-manager';
import { apiFetch, authFetch } from '@/lib/api';
import { updateProductAction } from '@/lib/seller-actions';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Editar producto' };
export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { id } = await params;
  const mine = await authFetch<ProductDetailDto[]>(
    token,
    '/products/mine',
  ).catch(() => []);
  const product = mine.find((p) => p.id === id);
  if (!product) notFound();

  const tree = await apiFetch<CategoryDto[]>('/categories').catch(() => []);
  const categories: CategoryOption[] = tree.flatMap((parent) =>
    parent.children.length > 0
      ? parent.children.map((child) => ({
          id: child.id,
          label: `${parent.name} › ${child.name}`,
        }))
      : [{ id: parent.id, label: parent.name }],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <nav className="text-xs text-zinc-400">
        <Link href="/vender/productos" className="hover:text-brand-600">
          Mis productos
        </Link>{' '}
        › Editar
      </nav>

      <div className="surface-card p-8">
        <h1 className="text-xl font-bold tracking-tight">Editar producto</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">{product.title}</p>
        <ProductForm
          mode="edit"
          categories={categories}
          action={updateProductAction}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando…"
          hidden={{ productId: product.id }}
          initial={{
            title: product.title,
            categoryId: product.category.id,
            description: product.description,
            brand: product.brand ?? '',
            condition: product.condition,
            images: product.images.map((image) => image.url),
            specs: product.specs,
          }}
        />
      </div>

      <section>
        <h2 className="mb-1 text-lg font-bold tracking-tight">Variantes</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Talles, colores u otras opciones del producto, cada una con su precio
          y stock.
        </p>
        <VariantManager
          productId={product.id}
          variants={product.variants}
          images={product.images.map((i) => i.url)}
        />
      </section>
    </div>
  );
}
