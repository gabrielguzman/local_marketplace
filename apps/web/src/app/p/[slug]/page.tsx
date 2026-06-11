import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ProductDetailDto } from '@marketplace/shared';
import { AddToCart } from '@/components/add-to-cart';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string): Promise<ProductDetailDto | null> {
  try {
    return await apiFetch<ProductDetailDto>(`/products/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.title ?? 'Producto no encontrado' };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const hasVariantOptions = product.variants.length > 1;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-brand-600">
          Inicio
        </Link>
        <span>›</span>
        <Link
          href={`/buscar?category=${product.category.slug}`}
          className="hover:text-brand-600"
        >
          {product.category.name}
        </Link>
        <span>›</span>
        <span className="truncate text-zinc-500">{product.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Galería */}
          <div className="surface-card overflow-hidden">
            <div className="flex aspect-[4/3] items-center justify-center bg-white">
              {product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <svg
                  className="h-20 w-20 text-zinc-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m4 17 5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 border-t border-zinc-100 p-3">
                {product.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
                  <img
                    key={image.id}
                    src={image.url}
                    alt=""
                    className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <section className="surface-card p-6">
              <h2 className="mb-3 text-base font-bold tracking-tight">
                Descripción
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-600">
                {product.description}
              </p>
            </section>
          )}
        </div>

        {/* Caja de compra */}
        <aside className="space-y-4">
          <div className="surface-card p-6 lg:sticky lg:top-32">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              {product.category.name}
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight">
              {product.title}
            </h1>

            <p className="mt-4 text-3xl font-extrabold tracking-tight">
              {formatPrice(defaultVariant.priceCents, defaultVariant.currency)}
            </p>

            <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
              {totalStock > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-green-700">
                    Stock disponible ({totalStock})
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-red-600">Sin stock</span>
                </>
              )}
            </p>

            {hasVariantOptions && (
              <div className="mt-5">
                <h2 className="mb-2 text-sm font-semibold text-zinc-700">
                  Variantes
                </h2>
                <ul className="space-y-1.5 text-sm">
                  {product.variants.map((variant) => (
                    <li
                      key={variant.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-2 transition hover:border-brand-300"
                    >
                      <span className="text-zinc-600">
                        {Object.values(variant.attributes).join(' · ') ||
                          'Estándar'}
                      </span>
                      <span className="font-semibold">
                        {formatPrice(variant.priceCents, variant.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <AddToCart
                variantId={defaultVariant.id}
                disabled={totalStock === 0}
              />
            </div>

            <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
              <p className="flex items-center gap-2">
                <span>🔒</span> Compra protegida: tu dinero está seguro
              </p>
              <p className="flex items-center gap-2">
                <span>↩️</span> Devolución gratis dentro de los 30 días
              </p>
            </div>
          </div>

          {/* Card del negocio */}
          <Link
            href={`/tienda/${product.business.slug}`}
            className="surface-card flex items-center gap-3.5 p-5 transition hover:border-brand-300"
          >
            {product.business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
              <img
                src={product.business.logoUrl}
                alt=""
                className="h-12 w-12 rounded-full border border-zinc-200 object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-xl">
                🏪
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs text-zinc-400">Vendido por</p>
              <p className="truncate text-sm font-semibold text-zinc-800">
                {product.business.name}
              </p>
              <p className="text-xs font-medium text-brand-600">
                Visitar tienda →
              </p>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
