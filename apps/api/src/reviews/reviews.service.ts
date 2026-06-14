import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MyReviewDto, ReviewDto } from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReportDto,
  CreateReviewDto,
  ReplyReviewDto,
  UpdateReviewDto,
} from './dto/reviews.dto';

const REVIEW_INCLUDE = {
  author: { select: { name: true } },
} satisfies Prisma.ReviewInclude;

type ReviewWithAuthor = Prisma.ReviewGetPayload<{
  include: typeof REVIEW_INCLUDE;
}>;

function toReviewDto(
  review: ReviewWithAuthor,
  helpfulCount = 0,
  votedHelpful = false,
): ReviewDto {
  return {
    id: review.id,
    productId: review.productId,
    authorId: review.authorId,
    rating: review.rating,
    comment: review.comment,
    authorName: review.author.name,
    createdAt: review.createdAt.toISOString(),
    sellerResponse: review.sellerResponse,
    sellerRespondedAt: review.sellerRespondedAt?.toISOString() ?? null,
    helpfulCount,
    votedHelpful,
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
      include: REVIEW_INCLUDE,
    });
    return toReviewDto(review);
  }

  // Las reseñas que escribió el usuario, con el producto al que apuntan
  async listMine(userId: string): Promise<MyReviewDto[]> {
    const rows = await this.prisma.review.findMany({
      where: { authorId: userId },
      include: { product: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      sellerResponse: r.sellerResponse,
      productTitle: r.product.title,
      productSlug: r.product.slug,
    }));
  }

  async listForProduct(
    productId: string,
    viewerId?: string,
  ): Promise<ReviewDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: REVIEW_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (reviews.length === 0) return [];

    const reviewIds = reviews.map((r) => r.id);
    const [counts, myVotes] = await Promise.all([
      this.prisma.reviewVote.groupBy({
        by: ['reviewId'],
        where: { reviewId: { in: reviewIds } },
        _count: true,
      }),
      viewerId
        ? this.prisma.reviewVote.findMany({
            where: { reviewId: { in: reviewIds }, userId: viewerId },
            select: { reviewId: true },
          })
        : Promise.resolve([]),
    ]);
    const countByReview = new Map(counts.map((c) => [c.reviewId, c._count]));
    const votedByMe = new Set(myVotes.map((v) => v.reviewId));

    return reviews.map((r) =>
      toReviewDto(r, countByReview.get(r.id) ?? 0, votedByMe.has(r.id)),
    );
  }

  // Alterna el voto "me resultó útil" del usuario sobre una reseña ajena
  async toggleHelpful(
    userId: string,
    productId: string,
    reviewId: string,
  ): Promise<{ helpfulCount: number; votedHelpful: boolean }> {
    const review = await this.findInProduct(reviewId, productId);
    if (review.authorId === userId) {
      throw new ConflictException({
        code: 'CANNOT_VOTE_OWN',
        message: 'No podés votar tu propia reseña',
      });
    }

    const existing = await this.prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.reviewVote.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reviewVote.create({ data: { reviewId, userId } });
    }

    const helpfulCount = await this.prisma.reviewVote.count({
      where: { reviewId },
    });
    return { helpfulCount, votedHelpful: !existing };
  }

  // El autor edita su propia reseña
  async update(
    userId: string,
    productId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    const review = await this.findInProduct(reviewId, productId);
    if (review.authorId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_REVIEW_AUTHOR',
        message: 'Solo podés editar tu propia reseña',
      });
    }
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
      include: REVIEW_INCLUDE,
    });
    return toReviewDto(updated);
  }

  // El autor borra su propia reseña
  async remove(
    userId: string,
    productId: string,
    reviewId: string,
  ): Promise<void> {
    const review = await this.findInProduct(reviewId, productId);
    if (review.authorId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_REVIEW_AUTHOR',
        message: 'Solo podés borrar tu propia reseña',
      });
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
  }

  // El dueño del negocio responde públicamente a una reseña
  async respond(
    userId: string,
    productId: string,
    reviewId: string,
    dto: ReplyReviewDto,
  ): Promise<ReviewDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        business: { select: { ownerId: true } },
        product: { select: { slug: true, title: true } },
      },
    });
    if (!review || review.productId !== productId) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Reseña no encontrada',
      });
    }
    if (review.business.ownerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_BUSINESS_OWNER',
        message: 'Solo el vendedor puede responder esta reseña',
      });
    }
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { sellerResponse: dto.response, sellerRespondedAt: new Date() },
      include: REVIEW_INCLUDE,
    });

    // avisar al autor de la reseña
    await this.notifications.notify({
      userId: review.authorId,
      type: 'REVIEW_REPLY',
      title: 'El vendedor respondió tu reseña',
      body: review.product.title,
      link: `/p/${review.product.slug}`,
    });
    return toReviewDto(updated);
  }

  // Un usuario denuncia una reseña ofensiva (1 por usuario y reseña)
  async reportReview(
    userId: string,
    productId: string,
    reviewId: string,
  ): Promise<void> {
    const review = await this.findInProduct(reviewId, productId);
    if (review.authorId === userId) {
      throw new ConflictException({
        code: 'CANNOT_REPORT_OWN',
        message: 'No podés denunciar tu propia reseña',
      });
    }
    await this.prisma.reviewReport.upsert({
      where: { reviewId_reporterId: { reviewId, reporterId: userId } },
      update: {},
      create: { reviewId, reporterId: userId },
    });
  }

  private async findInProduct(reviewId: string, productId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, authorId: true, productId: true },
    });
    if (!review || review.productId !== productId) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Reseña no encontrada',
      });
    }
    return review;
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
