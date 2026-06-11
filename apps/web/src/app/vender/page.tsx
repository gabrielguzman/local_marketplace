import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessDto, ProductDetailDto } from '@marketplace/shared';
import { BusinessForm } from '@/components/business-form';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Vender' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<
  ProductDetailDto['status'],
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Publicado', className: 'bg-green-50 text-green-700' },
  PAUSED: { label: 'Pausado', className: 'bg-amber-50 text-amber-700' },
  DRAFT: { label: 'Borrador', className: 'bg-zinc-100 text-zinc-600' },
  DELETED: { label: 'Eliminado', className: 'bg-red-50 text-red-600' },
};

export default async function SellerPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );

  if (!business) {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="surface-card p-8">
          <span className="text-3xl">🏪</span>
          <h1 className="mt-3 text-xl font-bold tracking-tight">
            Creá tu negocio
          </h1>
          <p className="mb-6 mt-1 text-sm leading-6 text-zinc-500">
            Para publicar productos primero necesitás una tienda. Es gratis y
            te toma un minuto.
          </p>
          <BusinessForm />
        </div>
      </div>
    );
  }

  const products = await authFetch<ProductDetailDto[]>(
    token,
    '/products/mine',
  ).catch(() => []);

  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const totalStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0),
    0,
  );

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
          <Link href="/vender/ventas" className="btn-secondary">
            Mis ventas
          </Link>
          <Link href="/vender/productos/nuevo" className="btn-primary">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Publicaciones activas', value: activeCount },
          { label: 'Productos totales', value: products.length },
          { label: 'Unidades en stock', value: totalStock },
        ].map((stat) => (
          <div key={stat.label} className="surface-card p-5">
            <p className="text-2xl font-extrabold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="surface-card border-dashed p-14 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 font-medium text-zinc-700">
            Todavía no publicaste productos
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Tu primer producto puede estar online en dos minutos.
          </p>
          <Link href="/vender/productos/nuevo" className="btn-primary mt-5">
            Publicar mi primer producto
          </Link>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-5 py-3.5">Precio</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variant =
                  product.variants.find((v) => v.isDefault) ??
                  product.variants[0];
                const badge = STATUS_BADGE[product.status];
                return (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-50 transition last:border-0 hover:bg-zinc-50/60"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/p/${product.slug}`}
                        className="font-medium text-zinc-800 hover:text-brand-600"
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {variant
                        ? formatPrice(variant.priceCents, variant.currency)
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {product.variants.reduce((sum, v) => sum + v.stock, 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
