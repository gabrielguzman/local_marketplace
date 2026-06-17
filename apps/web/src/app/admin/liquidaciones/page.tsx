import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminPayoutsView } from '@marketplace/shared';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';
import { adminCreatePayoutAction } from '@/lib/trust-actions';

export const metadata: Metadata = { title: 'Liquidaciones' };
export const dynamic = 'force-dynamic';

export default async function AdminPayoutsPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const data = await authFetch<AdminPayoutsView>(token, '/admin/payouts').catch(
    () => ({ rows: [], recent: [] }) as AdminPayoutsView,
  );

  const totalToPay = data.rows.reduce((s, r) => s + r.availableCents, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Liquidaciones</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Neto a pagar a cada vendedor por sus ventas{' '}
          <strong>entregadas</strong> y todavía sin liquidar (precio + envío −
          comisión). Registrar el pago marca esas ventas como saldadas.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold tracking-tight">Saldos por pagar</h2>
          {totalToPay > 0 && (
            <p className="text-sm text-zinc-500">
              Total a pagar:{' '}
              <strong className="text-zinc-900">
                {formatPrice(totalToPay)}
              </strong>
            </p>
          )}
        </div>

        {data.rows.length === 0 ? (
          <div className="surface-card border-dashed p-10 text-center text-sm text-zinc-500">
            No hay saldos pendientes de liquidar.
          </div>
        ) : (
          <div className="surface-card divide-y divide-zinc-50">
            {data.rows.map((row) => (
              <div
                key={row.businessId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-800">{row.businessName}</p>
                  <p className="text-xs text-zinc-400">
                    {row.salesCount}{' '}
                    {row.salesCount === 1
                      ? 'venta entregada'
                      : 'ventas entregadas'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold tracking-tight">
                    {formatPrice(row.availableCents)}
                  </span>
                  <form action={adminCreatePayoutAction}>
                    <input
                      type="hidden"
                      name="businessId"
                      value={row.businessId}
                    />
                    <button type="submit" className="btn-primary !px-4 !py-2">
                      Registrar pago
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold tracking-tight">
          Liquidaciones recientes
        </h2>
        {data.recent.length === 0 ? (
          <div className="surface-card border-dashed p-10 text-center text-sm text-zinc-500">
            Todavía no registraste ninguna liquidación.
          </div>
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5">Negocio</th>
                  <th className="px-5 py-3.5">Ventas</th>
                  <th className="px-5 py-3.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-500">
                      {new Date(p.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {p.businessName}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{p.salesCount}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      {formatPrice(p.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
