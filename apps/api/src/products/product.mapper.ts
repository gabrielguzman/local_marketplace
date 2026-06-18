import type {
  Currency,
  ProductDetailDto,
  ProductSpec,
  ProductSummaryDto,
  RatingSummary,
} from '@marketplace/shared';
import type { Prisma } from '@prisma/client';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    business: { select: { id: true; name: true; slug: true; logoUrl: true } };
    category: { select: { id: true; name: true; slug: true } };
    variants: true;
    images: true;
  };
}>;

export type ProductForSummary = Prisma.ProductGetPayload<{
  include: {
    business: { select: { name: true; slug: true } };
    variants: true;
    images: true;
  };
}>;

export function toProductDetailDto(
  p: ProductWithRelations,
  rating: RatingSummary = { avg: null, count: 0 },
): ProductDetailDto {
  return {
    rating,
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    condition: p.condition,
    specs: Array.isArray(p.specs) ? (p.specs as unknown as ProductSpec[]) : [],
    status: p.status,
    category: p.category,
    business: p.business,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      attributes: (v.attributes ?? {}) as Record<string, string>,
      priceCents: v.priceCents,
      currency: v.currency as Currency,
      stock: v.stock,
      isDefault: v.isDefault,
      imageUrl: v.imageUrl,
    })),
    images: [...p.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, url: i.url, position: i.position })),
    createdAt: p.createdAt.toISOString(),
  };
}

export function toProductSummaryDto(
  p: ProductForSummary,
  rating: RatingSummary = { avg: null, count: 0 },
): ProductSummaryDto {
  const variant =
    p.variants.find((v) => v.isDefault) ??
    [...p.variants].sort((a, b) => a.priceCents - b.priceCents)[0];
  const image = [...p.images].sort((a, b) => a.position - b.position)[0];
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    priceCents: variant?.priceCents ?? 0,
    currency: (variant?.currency ?? 'ARS') as Currency,
    condition: p.condition,
    imageUrl: image?.url ?? null,
    businessName: p.business.name,
    businessSlug: p.business.slug,
    rating,
  };
}
