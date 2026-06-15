import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  REPORT_REASON_LABELS,
  type AdminMetricPoint,
  type AdminStats,
  type ReportDto,
  type ReportStatus,
} from '@marketplace/shared';
import { MetricsChart } from '@/components/metrics-chart';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';
import {
  adminBusinessStatusAction,
  adminProductStatusAction,
  adminResolveReportAction,
} from '@/lib/trust-actions';

export const metadata: Metadata = { title: 'Administración' };
export const dynamic = 'force-dynamic';

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'RESOLVED', label: 'Resueltas' },
  { value: 'DISMISSED', label: 'Desestimadas' },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { estado } = await searchParams;
  const reportStatus: ReportStatus = STATUS_TABS.some((t) => t.value === estado)
    ? (estado as ReportStatus)
    : 'PENDING';

  const [stats, metrics, reports] = await Promise.all([
    authFetch<AdminStats>(token, '/admin/stats').catch(() => null),
    authFetch<AdminMetricPoint[]>(token, '/admin/metrics').catch(
      () => [] as AdminMetricPoint[],
    ),
    authFetch<ReportDto[]>(token, `/admin/reports?status=${reportStatus}`).catch(
      () => [],
    ),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Panel de moderación
      </h1>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {[
            { label: 'Facturación (GMV)', value: formatPrice(stats.gmvCents) },
            {
              label: 'Comisión cobrada',
              value: formatPrice(stats.feesCents),
              highlight: true,
            },
            { label: 'Órdenes pagadas', value: stats.paidOrders },
            { label: 'Usuarios', value: stats.users },
            { label: 'Negocios', value: stats.businesses },
            { label: 'Productos activos', value: stats.activeProducts },
            { label: 'Denuncias pendientes', value: stats.pendingReports },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`surface-card p-4 ${
                stat.highlight ? 'border-brand-300 bg-brand-50/50' : ''
              }`}
            >
              <p className="truncate text-xl font-extrabold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {metrics.length > 0 && <MetricsChart points={metrics} />}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight">Denuncias</h2>
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 text-xs">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`/admin?estado=${tab.value}`}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  reportStatus === tab.value
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="surface-card border-dashed p-12 text-center text-zinc-500">
            {reportStatus === 'PENDING'
              ? '🎉 No hay denuncias pendientes.'
              : 'Nada por acá.'}
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

                {report.status === 'PENDING' && (
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
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
