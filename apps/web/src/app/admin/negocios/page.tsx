import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminBusinessDto, Page } from '@marketplace/shared';
import { ConfirmForm } from '@/components/confirm-form';
import { Pagination } from '@/components/pagination';
import { authFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/session';
import { adminBusinessStatusAction } from '@/lib/trust-actions';

export const metadata: Metadata = { title: 'Negocios' };
export const dynamic = 'force-dynamic';

const EMPTY: Page<AdminBusinessDto> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-green-50 text-green-700' },
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700' },
  SUSPENDED: { label: 'Suspendido', className: 'bg-red-50 text-red-600' },
};

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { q, page } = await searchParams;
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (page) query.set('page', page);
  const result = await authFetch<Page<AdminBusinessDto>>(
    token,
    `/admin/businesses?${query}`,
  ).catch(() => EMPTY);
  const businesses = result.items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
        <form action="/admin/negocios" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre…"
            className="field-input w-64 !py-2"
          />
          <button type="submit" className="btn-secondary !py-2">
            Buscar
          </button>
        </form>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-3.5">Negocio</th>
              <th className="px-5 py-3.5">Dueño</th>
              <th className="px-5 py-3.5">Productos</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => {
              const badge = STATUS_BADGE[business.status];
              return (
                <tr
                  key={business.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/tienda/${business.slug}`}
                      className="font-medium text-zinc-800 hover:text-brand-600"
                    >
                      {business.name}
                    </Link>
                    <p className="text-xs text-zinc-400">
                      {new Date(business.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {business.ownerEmail}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {business.productCount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ConfirmForm
                      action={adminBusinessStatusAction}
                      fields={{
                        businessId: business.id,
                        status:
                          business.status === 'SUSPENDED'
                            ? 'ACTIVE'
                            : 'SUSPENDED',
                      }}
                      confirmText={
                        business.status === 'SUSPENDED'
                          ? `¿Reactivar "${business.name}"?`
                          : `¿Suspender "${business.name}"? Sus productos dejarán de verse.`
                      }
                    >
                      <button
                        type="submit"
                        className={`text-xs hover:underline ${
                          business.status === 'SUSPENDED'
                            ? 'text-green-700'
                            : 'text-red-600'
                        }`}
                      >
                        {business.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'}
                      </button>
                    </ConfirmForm>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <p className="p-10 text-center text-sm text-zinc-500">
            No se encontraron negocios.
          </p>
        )}
      </div>

      <Pagination
        basePath="/admin/negocios"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        params={{ q }}
      />
    </div>
  );
}
