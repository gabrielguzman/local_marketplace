import type { BusinessDto } from '@marketplace/shared';
import type { Business } from '@prisma/client';

export function toBusinessDto(business: Business): BusinessDto {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    logoUrl: business.logoUrl,
    bannerUrl: business.bannerUrl,
    status: business.status,
    createdAt: business.createdAt.toISOString(),
  };
}
