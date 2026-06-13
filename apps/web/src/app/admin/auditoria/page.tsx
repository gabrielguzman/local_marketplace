import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AuditLogDto, Page } from '@marketplace/shared';
import { Pagination } from '@/components/pagination';
import { authFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Auditoría' };
export const dynamic = 'force-dynamic';

const EMPTY: Page<AuditLogDto> = { items: [], total: 0, page: 1, pageSize: 20 };

const TARGET_LABEL: Record<string, string> = {
  USER: 'Usuario',
  PRODUCT: 'Producto',
  BUSINESS: 'Negocio',
  REPORT: 'Denuncia',
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { page } = await searchParams;
  const query = page ? `?page=${page}` : '';
  const result = await authFetch<Page<AuditLogDto>>(
    token,
    `/admin/audit${query}`,
  ).catch(() => EMPTY);
  const logs = result.items;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Auditoría{' '}
        <span className="text-sm font-normal text-zinc-400">
          ({result.total})
        </span>
      </h1>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-3.5">Fecha</th>
              <th className="px-5 py-3.5">Admin</th>
              <th className="px-5 py-3.5">Acción</th>
              <th className="px-5 py-3.5">Objeto</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
              >
                <td className="whitespace-nowrap px-5 py-3.5 text-zinc-500">
                  {new Date(log.createdAt).toLocaleString('es-AR')}
                </td>
                <td className="px-5 py-3.5 font-medium text-zinc-800">
                  {log.actorName}
                </td>
                <td className="px-5 py-3.5 text-zinc-600">{log.summary}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {TARGET_LABEL[log.targetType] ?? log.targetType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-10 text-center text-sm text-zinc-500">
            Todavía no hay acciones registradas.
          </p>
        )}
      </div>

      <Pagination
        basePath="/admin/auditoria"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
