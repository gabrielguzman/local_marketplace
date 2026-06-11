import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ReviewDto } from '@marketplace/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, CreateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Solo puede reseñar quien recibió el producto (sub-orden DELIVERED)
  async create(
    userId: string,
    productId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { businessId: true, status: true },
    });
    if (!product || product.status === 'DELETED') {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }

    const delivered = await this.prisma.orderItem.findFirst({
      where: {
        variant: { productId },
        subOrder: {
          status: 'DELIVERED',
          order: { buyerId: userId },
        },
      },
      select: { id: true },
    });
    if (!delivered) {
      throw new ForbiddenException({
        code: 'NOT_ELIGIBLE',
        message: 'Solo podés reseñar productos que compraste y recibiste',
      });
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_authorId: { productId, authorId: userId } },
    });
    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_REVIEWED',
        message: 'Ya dejaste una reseña para este producto',
      });
    }

    const review = await this.prisma.review.create({
      data: {
        productId,
        businessId: product.businessId,
        authorId: userId,
        rating: dto.rating,
        comment: dto.comment ?? '',
      },
      include: { author: { select: { name: true } } },
    });
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      authorName: review.author.name,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async listForProduct(productId: string): Promise<ReviewDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      authorName: review.author.name,
      createdAt: review.createdAt.toISOString(),
    }));
  }

  async report(
    userId: string,
    productId: string,
    dto: CreateReportDto,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product || product.status === 'DELETED') {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }

    const existing = await this.prisma.report.findUnique({
      where: { productId_reporterId: { productId, reporterId: userId } },
    });
    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_REPORTED',
        message: 'Ya denunciaste esta publicación',
      });
    }

    await this.prisma.report.create({
      data: {
        productId,
        reporterId: userId,
        reason: dto.reason,
        details: dto.details ?? '',
      },
    });
  }
}
