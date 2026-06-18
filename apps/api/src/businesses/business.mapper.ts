import type {
  BusinessDto,
  BusinessStats,
  RatingSummary,
} from '@marketplace/shared';
import type { Business } from '@prisma/client';

export function toBusinessDto(
  business: Business,
  rating: RatingSummary = { avg: null, count: 0 },
  stats?: BusinessStats,
  followers = 0,
): BusinessDto {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    logoUrl: business.logoUrl,
    bannerUrl: business.bannerUrl,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    instagram: business.instagram,
    address: business.address,
    city: business.city,
    province: business.province,
    hours: business.hours,
    policies: business.policies,
    pickupEnabled: business.pickupEnabled,
    shippingCents: business.shippingCents,
    status: business.status,
    rating,
    createdAt: business.createdAt.toISOString(),
    ...(stats && { stats }),
    followers,
  };
}
