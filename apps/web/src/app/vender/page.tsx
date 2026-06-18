import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  PLATFORM_FEE_PERCENT,
  type BusinessDto,
  type SellerDashboard,
} from '@marketplace/shared';
import { BusinessForm } from '@/components/business-form';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { SUB_ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Vender' };
export const dynamic = 'force-dynamic';

export default async function SellerPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );

  if (!business) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-12">
        <div>
          <span className="text-3xl">🏪</span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Vendé en Mercato
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            El marketplace que está del lado del comercio de barrio. Gratis y
            en un minuto.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: '💸',
              title: `Te quedás con el ${100 - PLATFORM_FEE_PERCENT}%`,
              text: `Comisión transparente del ${PLATFORM_FEE_PERCENT}%, sin costos ocultos ni de alta.`,
            },
            {
              icon: '⚡',
              title: 'Cobrás rápido',
              text: 'Te liquidamos el neto apenas la venta figura entregada.',
            },
            {
              icon: '⚖️',
              title: 'Sin pay-to-win',
              text: 'No se compra posición: ordenan la cercanía y tu reputación real.',
            },
          ].map((b) => (
            <div key={b.title} className="surface-card p-4">
              <span className="text-xl">{b.icon}</span>
              <h3 className="mt-1.5 text-sm font-semibold text-zinc-900">
                {b.title}
              </h3>
              <p className="mt-0.5 text-xs leading-5 text-zinc-500">{b.text}</p>
            </div>
          ))}
        </div>

        <div className="surface-card p-8">
          <h2 className="text-lg font-bold tracking-tight">Creá tu negocio</h2>
          <p className="mb-6 mt-1 text-sm leading-6 text-zinc-500">
            Para publicar productos primero necesitás una tienda.
          </p>
          <BusinessForm />
        </div>
      </div>
    );
  }

  const dashboard = await authFetch<SellerDashboard>(
    token,
    '/businesses/me/dashboard',
  ).catch(() => null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Panel de vendedor
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
          <Link
            href={`/tienda/${business.slug}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Ver mi tienda pública →
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/vender/cartel" className="btn-secondary">
            📲 Cartel QR
          </Link>
          <Link href="/vender/productos/nuevo" className="btn-primary">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {dashboard && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Link
              href="/vender/cobros"
              className="surface-card p-5 transition hover:border-brand-300"
            >
              <p className="text-2xl font-extrabold tracking-tight">
                {formatPrice(dashboard.netCents)}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                Neto a cobrar ({dashboard.salesCount}{' '}
                {dashboard.salesCount === 1 ? 'venta' : 'ventas'}) →
              </p>
              <p className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-400">
                Facturado {formatPrice(dashboard.revenueCents)} · comisión{' '}
                {PLATFORM_FEE_PERCENT}% −{formatPrice(dashboard.feesCents)}
              </p>
            </Link>
            <Link href="/vender/ventas" className="surface-card p-5 transition hover:border-brand-300">
              <p className="text-2xl font-extrabold tracking-tight">
                {dashboard.pendingSalesCount}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                Ventas por despachar →
              </p>
            </Link>
            <Link href="/vender/productos" className="surface-card p-5 transition hover:border-brand-300">
              <p className="text-2xl font-extrabold tracking-tight">
                {dashboard.activeProducts}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                Publicaciones activas →
              </p>
            </Link>
            <div
              className={`surface-card p-5 ${dashboard.lowStockVariants > 0 ? 'border-amber-300 bg-amber-50/40' : ''}`}
            >
              <p className="text-2xl font-extrabold tracking-tight">
                {dashboard.lowStockVariants}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {dashboard.lowStockVariants > 0 ? '⚠️ ' : ''}Variantes con
                stock bajo
              </p>
            </div>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">
                Últimas ventas
              </h2>
              <Link
                href="/vender/ventas"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            {dashboard.recentSales.length === 0 ? (
              <div className="surface-card border-dashed p-10 text-center text-sm text-zinc-500">
                Cuando alguien compre en tu tienda, lo vas a ver acá.
              </div>
            ) : (
              <div className="surface-card divide-y divide-zinc-50">
                {dashboard.recentSales.map((sale) => {
                  const badge = SUB_ORDER_STATUS_LABEL[sale.status];
                  return (
                    <div
                      key={sale.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-800">
                          {sale.items.map((i) => i.title).join(', ')}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {sale.buyerName} ·{' '}
                          {new Date(sale.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(sale.subtotalCents)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
