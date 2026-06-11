import type { BusinessDto, RatingSummary } from '@marketplace/shared';
import type { Business } from '@prisma/client';

export function toBusinessDto(
  business: Business,
  rating: RatingSummary = { avg: null, count: 0 },
): BusinessDto {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    logoUrl: business.logoUrl,
    bannerUrl: business.bannerUrl,
    status: business.status,
    rating,
    createdAt: business.createdAt.toISOString(),
  };
}
