import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductSummaryDto, RatingSummary } from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toProductSummaryDto } from '../products/product.mapper';

const SUMMARY_INCLUDE = {
  business: { select: { name: true, slug: true } },
  variants: true,
  images: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ProductSummaryDto[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId, product: { status: { not: 'DELETED' } } },
      include: { product: { include: SUMMARY_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
    const products = favorites.map((f) => f.product);

    // ratings de la página en una sola consulta
    const grouped = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p) => p.id) } },
      _avg: { rating: true },
      _count: true,
    });
    const ratings = new Map<string, RatingSummary>(
      grouped.map((g) => [
        g.productId,
        {
          avg: g._avg.rating === null ? null : Number(g._avg.rating.toFixed(1)),
          count: g._count,
        },
      ]),
    );
    return products.map((p) => toProductSummaryDto(p, ratings.get(p.id)));
  }

  async ids(userId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
    });
    return favorites.map((f) => f.productId);
  }

  async add(userId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    if (!product || product.status === 'DELETED') {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }
    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, productId } });
  }
}
