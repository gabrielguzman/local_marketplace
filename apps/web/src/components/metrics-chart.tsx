import type { AdminMetricPoint } from '@marketplace/shared';
import { formatPrice } from '@/lib/format';

// Gráfico de barras de facturación diaria (CSS puro, sin librería)
export function MetricsChart({ points }: { points: AdminMetricPoint[] }) {
  const maxRevenue = Math.max(1, ...points.map((p) => p.revenueCents));
  const totalRevenue = points.reduce((sum, p) => sum + p.revenueCents, 0);
  const totalOrders = points.reduce((sum, p) => sum + p.orders, 0);

  return (
    <section className="surface-card p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight">Últimos 14 días</h2>
        <p className="text-sm text-zinc-500">
          {totalOrders} {totalOrders === 1 ? 'orden' : 'órdenes'} ·{' '}
          <strong className="text-zinc-800">{formatPrice(totalRevenue)}</strong>
        </p>
      </div>

      <div className="flex h-40 items-end gap-1.5">
        {points.map((point) => {
          const heightPct = Math.round((point.revenueCents / maxRevenue) * 100);
          const day = new Date(point.date + 'T00:00:00');
          return (
            <div
              key={point.date}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${day.toLocaleDateString('es-AR')}: ${point.orders} órdenes · ${formatPrice(point.revenueCents)}`}
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-brand-500/80 transition hover:bg-brand-600"
                  style={{ height: `${Math.max(point.revenueCents > 0 ? 4 : 0, heightPct)}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400">
                {day.getUTCDate()}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
