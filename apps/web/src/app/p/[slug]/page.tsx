import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ProductDetailDto } from '@marketplace/shared';
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
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <nav className="text-xs text-zinc-500">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>{' '}
          ›{' '}
          <Link
            href={`/buscar?category=${product.category.slug}`}
            className="hover:underline"
          >
            {product.category.name}
          </Link>
        </nav>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {product.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
            <img
              src={product.images[0].url}
              alt={product.title}
              className="mx-auto max-h-[480px] object-contain"
            />
          ) : (
            <div className="flex h-72 items-center justify-center text-6xl text-zinc-200">
              🛍️
            </div>
          )}
        </div>

        {product.description && (
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
              {product.description}
            </p>
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h1 className="text-xl font-semibold leading-snug">
            {product.title}
          </h1>
          <p className="mt-3 text-3xl font-bold">
            {formatPrice(defaultVariant.priceCents, defaultVariant.currency)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {totalStock > 0 ? `Stock disponible: ${totalStock}` : 'Sin stock'}
          </p>

          {hasVariantOptions && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-medium text-zinc-600">
                Variantes
              </h2>
              <ul className="space-y-1 text-sm">
                {product.variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="flex items-center justify-between rounded border border-zinc-200 px-3 py-1.5"
                  >
                    <span className="text-zinc-700">
                      {Object.values(variant.attributes).join(' · ') ||
                        'Estándar'}
                    </span>
                    <span className="font-medium">
                      {formatPrice(variant.priceCents, variant.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            disabled
            title="El carrito llega en la próxima fase"
            className="mt-5 w-full cursor-not-allowed rounded-md bg-amber-400/60 py-2.5 font-medium text-zinc-600"
          >
            Comprar (próximamente)
          </button>
        </div>

        <Link
          href={`/tienda/${product.business.slug}`}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
        >
          {product.business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
            <img
              src={product.business.logoUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-lg">
              🏪
            </span>
          )}
          <div>
            <p className="text-sm font-medium">{product.business.name}</p>
            <p className="text-xs text-zinc-500">Ver tienda →</p>
          </div>
        </Link>
      </aside>
    </div>
  );
}
