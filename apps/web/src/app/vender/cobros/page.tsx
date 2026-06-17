import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  PLATFORM_FEE_PERCENT,
  type SellerPayoutSummary,
} from '@marketplace/shared';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Cobros' };
export const dynamic = 'force-dynamic';

export default async function CobrosPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const data = await authFetch<SellerPayoutSummary>(
    token,
    '/businesses/me/payouts',
  ).catch(() => null);
  if (!data) redirect('/vender');

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-400">
        <Link href="/vender" className="hover:text-brand-600">
          Panel de vendedor
        </Link>{' '}
        › Cobros
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cobros</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Te liquidamos el neto de tus ventas{' '}
          <strong>una vez entregadas</strong> (precio + envío − {PLATFORM_FEE_PERCENT}
          % de comisión).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface-card border-green-200 bg-green-50/40 p-5">
          <p className="text-2xl font-extrabold tracking-tight text-green-700">
            {formatPrice(data.availableCents)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">Disponible para cobrar</p>
          <p className="mt-1 text-xs text-zinc-400">Ventas entregadas sin liquidar</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-2xl font-extrabold tracking-tight">
            {formatPrice(data.pendingCents)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">En camino</p>
          <p className="mt-1 text-xs text-zinc-400">
            Pagas, todavía no entregadas
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-2xl font-extrabold tracking-tight">
            {formatPrice(data.paidCents)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">Ya liquidado</p>
          <p className="mt-1 text-xs text-zinc-400">Total histórico cobrado</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-base font-bold tracking-tight">
          Historial de liquidaciones
        </h2>
        {data.payouts.length === 0 ? (
          <div className="surface-card border-dashed p-10 text-center text-sm text-zinc-500">
            Todavía no recibiste ninguna liquidación. Cuando entreguemos tus
            ventas y te transfiramos, lo vas a ver acá.
          </div>
        ) : (
          <div className="surface-card divide-y divide-zinc-50">
            {data.payouts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-800">
                    {new Date(p.createdAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {p.salesCount} {p.salesCount === 1 ? 'venta' : 'ventas'}
                    {p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                <span className="font-semibold text-green-700">
                  {formatPrice(p.amountCents)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
