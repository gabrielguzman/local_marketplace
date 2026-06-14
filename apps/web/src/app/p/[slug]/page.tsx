import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type {
  BusinessDto,
  Paginated,
  ProductDetailDto,
  ProductSummaryDto,
  QuestionDto,
  ReviewDto,
} from '@marketplace/shared';
import { BuyBox } from '@/components/add-to-cart';
import { FavoriteButton } from '@/components/favorite-button';
import { ProductCard } from '@/components/product-card';
import { QuestionsSection } from '@/components/questions-section';
import { RatingBars } from '@/components/rating-bars';
import { ReportButton } from '@/components/report-button';
import { ReviewItem } from '@/components/review-item';
import { Stars } from '@/components/stars';
import { TrackView } from '@/components/track-view';
import { apiFetch, authFetch } from '@/lib/api';
import { getFavoriteIds } from '@/lib/favorites';
import { getAccessToken, getCurrentUser } from '@/lib/session';

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
  if (!product) return { title: 'Producto no encontrado' };

  const description =
    product.description.slice(0, 160) ||
    `Comprá ${product.title} en ${product.business.name}.`;
  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      ...(product.images[0] && { images: [product.images[0].url] }),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [reviews, questions] = await Promise.all([
    apiFetch<ReviewDto[]>(`/products/${product.id}/reviews`).catch(
      () => [] as ReviewDto[],
    ),
    apiFetch<QuestionDto[]>(`/products/${product.id}/questions`).catch(
      () => [] as QuestionDto[],
    ),
  ]);

  // Productos de la misma categoría (excluye el actual)
  const relatedRes = await apiFetch<Paginated<ProductSummaryDto>>(
    `/search?category=${product.category.slug}&limit=6`,
  ).catch((): Paginated<ProductSummaryDto> => ({ items: [], nextCursor: null }));
  const related = relatedRes.items
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // ¿el que mira es el autor de alguna reseña o el dueño del negocio?
  const currentUser = await getCurrentUser();
  let isOwner = false;
  let isFavorite = false;
  if (currentUser) {
    const token = await getAccessToken();
    if (token) {
      const [myBusiness, favoriteIds] = await Promise.all([
        authFetch<BusinessDto>(token, '/businesses/me').catch(() => null),
        getFavoriteIds(),
      ]);
      isOwner = myBusiness?.id === product.business.id;
      isFavorite = favoriteIds.has(product.id);
    }
  }

  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || product.title,
    image: product.images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      price: (defaultVariant.priceCents / 100).toFixed(2),
      priceCurrency: defaultVariant.currency,
      availability:
        totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    ...(product.rating.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.avg,
        reviewCount: product.rating.count,
      },
    }),
  };

  return (
    <div className="space-y-6">
      <TrackView slug={product.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-brand-600">
          Inicio
        </Link>
        <span>›</span>
        <Link
          href={`/c/${product.category.slug}`}
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

          {/* Ficha técnica */}
          {product.specs.length > 0 && (
            <section className="surface-card p-6">
              <h2 className="mb-3 text-base font-bold tracking-tight">
                Ficha técnica
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {product.specs.map((spec, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-50 last:border-0"
                    >
                      <td className="py-2 pr-4 text-zinc-400">{spec.key}</td>
                      <td className="py-2 font-medium text-zinc-700">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

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

          {/* Reseñas */}
          <section className="surface-card p-6">
            <h2 className="mb-4 text-base font-bold tracking-tight">Reseñas</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Este producto todavía no tiene reseñas. Comprálo y sé el
                primero en opinar.
              </p>
            ) : (
              <>
                <div className="mb-5 border-b border-zinc-100 pb-5">
                  <RatingBars rating={product.rating} reviews={reviews} />
                </div>
                <ul className="divide-y divide-zinc-100">
                {reviews.map((review) => (
                  <ReviewItem
                    key={review.id}
                    review={review}
                    productSlug={product.slug}
                    isMine={review.authorId === currentUser?.id}
                    canReply={isOwner}
                    canReport={Boolean(currentUser)}
                    canVote={Boolean(currentUser)}
                  />
                ))}
                </ul>
              </>
            )}
          </section>

          {/* Preguntas y respuestas */}
          <QuestionsSection
            productId={product.id}
            slug={product.slug}
            questions={questions}
            canAnswer={isOwner}
            isLoggedIn={Boolean(currentUser)}
          />
        </div>

        {/* Caja de compra */}
        <aside className="space-y-4">
          <div className="surface-card p-6 lg:sticky lg:top-32">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {product.category.name}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  product.condition === 'USED'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {product.condition === 'USED' ? 'Usado' : 'Nuevo'}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight">
              {product.title}
            </h1>
            {product.brand && (
              <p className="mt-0.5 text-sm text-zinc-500">
                Marca: <span className="font-medium text-zinc-700">{product.brand}</span>
              </p>
            )}
            <div className="mt-1.5">
              <Stars rating={product.rating} />
            </div>

            <BuyBox variants={product.variants} />

            <div className="mt-3">
              <FavoriteButton
                productId={product.id}
                slug={product.slug}
                favorited={isFavorite}
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

          <ReportButton productId={product.id} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
