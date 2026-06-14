import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { CategoryDto } from '@marketplace/shared';
import { CategoryAddForm } from '@/components/category-add-form';
import { CategoryRow } from '@/components/category-row';
import { authFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Categorías' };
export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const tree = await authFetch<CategoryDto[]>(token, '/categories').catch(
    () => [],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>

      <section className="surface-card p-6">
        <h2 className="mb-4 text-base font-bold tracking-tight">
          Nueva categoría
        </h2>
        <CategoryAddForm parents={tree} />
      </section>

      <section className="surface-card divide-y divide-zinc-50 p-6">
        {tree.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay categorías.</p>
        ) : (
          tree.map((parent) => (
            <div key={parent.id} className="py-2 first:pt-0 last:pb-0">
              <CategoryRow id={parent.id} name={parent.name} />
              {parent.children.map((child) => (
                <CategoryRow
                  key={child.id}
                  id={child.id}
                  name={child.name}
                  child
                />
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
