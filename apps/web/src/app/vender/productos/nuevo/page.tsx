import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessDto, CategoryDto } from '@marketplace/shared';
import { ProductForm, type CategoryOption } from '@/components/product-form';
import { apiFetch, authFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Nuevo producto' };
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );
  if (!business) redirect('/vender');

  const tree = await apiFetch<CategoryDto[]>('/categories').catch(() => []);
  // el select usa las hojas: "Tecnología › Celulares"
  const categories: CategoryOption[] = tree.flatMap((parent) =>
    parent.children.length > 0
      ? parent.children.map((child) => ({
          id: child.id,
          label: `${parent.name} › ${child.name}`,
        }))
      : [{ id: parent.id, label: parent.name }],
  );

  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="mb-6 text-xl font-semibold">Publicar un producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
