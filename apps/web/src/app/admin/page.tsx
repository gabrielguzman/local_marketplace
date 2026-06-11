import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  REPORT_REASON_LABELS,
  type AdminStats,
  type ReportDto,
} from '@marketplace/shared';
import { authFetch } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import {
  adminBusinessStatusAction,
  adminProductStatusAction,
  adminResolveReportAction,
} from '@/lib/trust-actions';

export const metadata: Metadata = { title: 'Administración' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') notFound();

  const token = (await getAccessToken())!;
  const [stats, reports] = await Promise.all([
    authFetch<AdminStats>(token, '/admin/stats').catch(() => null),
    authFetch<ReportDto[]>(token, '/admin/reports?status=PENDING').catch(
      () => [],
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Administración
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Panel de moderación
        </h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: 'Usuarios', value: stats.users },
            { label: 'Negocios', value: stats.businesses },
            { label: 'Productos activos', value: stats.activeProducts },
            { label: 'Órdenes pagadas', value: stats.paidOrders },
            { label: 'Denuncias pendientes', value: stats.pendingReports },
          ].map((stat) => (
            <div key={stat.label} className="surface-card p-4">
              <p className="text-2xl font-extrabold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          Denuncias pendientes
        </h2>
        {reports.length === 0 ? (
          <div className="surface-card border-dashed p-12 text-center text-zinc-500">
            🎉 No hay denuncias pendientes.
          </div>
        ) : (
          <ul className="space-y-4">
            {reports.map((report) => (
              <li key={report.id} className="surface-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
                  <div>
                    <Link
                      href={`/p/${report.product.slug}`}
                      className="text-sm font-semibold text-zinc-800 hover:text-brand-600"
                    >
                      {report.product.title}
                    </Link>
                    <p className="text-xs text-zinc-400">
                      Tienda: {report.product.businessName} · Denunció:{' '}
                      {report.reporterName} ·{' '}
                      {new Date(report.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                    {REPORT_REASON_LABELS[report.reason]}
                  </span>
                </div>

                {report.details && (
                  <p className="border-b border-zinc-100 px-5 py-3 text-sm text-zinc-600">
                    “{report.details}”
                  </p>
                )}

                <div className="flex flex-wrap gap-2 px-5 py-3.5">
                  <form action={adminProductStatusAction}>
                    <input type="hidden" name="productId" value={report.product.id} />
                    <input type="hidden" name="status" value="PAUSED" />
                    <button type="submit" className="btn-secondary !py-1.5 text-xs">
                      Pausar producto
                    </button>
                  </form>
                  <form action={adminBusinessStatusAction}>
                    <input type="hidden" name="businessId" value={report.product.businessId} />
                    <input type="hidden" name="status" value="SUSPENDED" />
                    <button
                      type="submit"
                      className="btn-secondary !py-1.5 text-xs !text-red-600"
                    >
                      Suspender negocio
                    </button>
                  </form>
                  <span className="flex-1" />
                  <form action={adminResolveReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="status" value="RESOLVED" />
                    <button type="submit" className="btn-primary !py-1.5 text-xs">
                      Marcar resuelta
                    </button>
                  </form>
                  <form action={adminResolveReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="status" value="DISMISSED" />
                    <button
                      type="submit"
                      className="text-xs text-zinc-400 hover:underline"
                    >
                      Desestimar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
