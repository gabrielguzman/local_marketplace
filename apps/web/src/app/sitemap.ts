import type { MetadataRoute } from 'next';
import type {
  BusinessCardDto,
  CategoryDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
import { apiFetch } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, stores] = await Promise.all([
    apiFetch<CategoryDto[]>('/categories').catch((): CategoryDto[] => []),
    apiFetch<Paginated<ProductSummaryDto>>('/search?limit=50').catch(
      (): Paginated<ProductSummaryDto> => ({ items: [], nextCursor: null }),
    ),
    apiFetch<BusinessCardDto[]>('/businesses').catch(
      (): BusinessCardDto[] => [],
    ),
  ]);

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/buscar`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/tiendas`, changeFrequency: 'daily', priority: 0.7 },
    ...categories.map((cat) => ({
      url: `${SITE_URL}/buscar?category=${cat.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...stores.map((store) => ({
      url: `${SITE_URL}/tienda/${store.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...products.items.map((product) => ({
      url: `${SITE_URL}/p/${product.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
