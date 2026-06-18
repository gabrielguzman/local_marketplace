import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BusinessCardDto,
  BusinessStats,
  RatingSummary,
} from '@marketplace/shared';
import type { Business } from '@prisma/client';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(
    userId: string,
    dto: CreateBusinessDto,
  ): Promise<Business> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verificá tu email antes de crear un negocio',
      });
    }

    const existing = await this.prisma.business.findUnique({
      where: { ownerId: userId },
    });
    if (existing) {
      throw new ConflictException({
        code: 'BUSINESS_EXISTS',
        message: 'Ya tenés un negocio creado',
      });
    }

    return this.prisma.business.create({
      data: {
        ownerId: userId,
        name: dto.name,
        description: dto.description ?? '',
        slug: await this.uniqueSlug(dto.name),
        // Sin moderación en el MVP: el negocio nace activo
        status: 'ACTIVE',
      },
    });
  }

  async findBySlug(slug: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { slug },
    });
    if (!business || business.status === 'SUSPENDED') {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Negocio no encontrado',
      });
    }
    return business;
  }

  async findMine(userId: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { ownerId: userId },
    });
    if (!business) {
      throw new NotFoundException({
        code: 'NO_BUSINESS',
        message: 'Todavía no creaste tu negocio',
      });
    }
    return business;
  }

  async updateMine(userId: string, dto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findMine(userId);
    return this.prisma.business.update({
      where: { id: business.id },
      data: dto,
    });
  }

  // Tiendas activas para el home / directorio, ordenadas por catálogo y
  // reputación. Si viene limit, devuelve solo las primeras (destacadas).
  async listPublic(limit?: number, q?: string): Promise<BusinessCardDto[]> {
    const term = q?.trim();
    const businesses = await this.prisma.business.findMany({
      where: {
        status: 'ACTIVE',
        ...(term && { name: { contains: term, mode: 'insensitive' } }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        city: true,
        province: true,
        _count: {
          select: { products: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    const grouped = await this.prisma.review.groupBy({
      by: ['businessId'],
      where: { businessId: { in: businesses.map((b) => b.id) } },
      _avg: { rating: true },
      _count: true,
    });
    const ratings = new Map<string, RatingSummary>(
      grouped.map((g) => [
        g.businessId,
        {
          avg: g._avg.rating === null ? null : Number(g._avg.rating.toFixed(1)),
          count: g._count,
        },
      ]),
    );

    const cards: BusinessCardDto[] = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      logoUrl: b.logoUrl,
      bannerUrl: b.bannerUrl,
      city: b.city,
      province: b.province,
      rating: ratings.get(b.id) ?? { avg: null, count: 0 },
      productCount: b._count.products,
    }));

    // más productos primero, luego mejor reputación, luego alfabético
    cards.sort(
      (a, b) =>
        b.productCount - a.productCount ||
        b.rating.count - a.rating.count ||
        a.name.localeCompare(b.name),
    );

    return limit ? cards.slice(0, limit) : cards;
  }

  async ratingFor(businessId: string): Promise<RatingSummary> {
    const agg = await this.prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: true,
    });
    return {
      avg: agg._avg.rating === null ? null : Number(agg._avg.rating.toFixed(1)),
      count: agg._count,
    };
  }

  // Métricas públicas: productos activos y ventas concretadas (sub-órdenes
  // entregadas). Se muestran en el perfil de la tienda.
  async publicStats(businessId: string): Promise<BusinessStats> {
    const [productCount, salesCount] = await this.prisma.$transaction([
      this.prisma.product.count({
        where: { businessId, status: 'ACTIVE' },
      }),
      this.prisma.subOrder.count({
        where: { businessId, status: 'DELIVERED' },
      }),
    ]);
    return { productCount, salesCount };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    for (let i = 2; ; i++) {
      const taken = await this.prisma.business.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
      candidate = `${base}-${i}`;
    }
  }
}
