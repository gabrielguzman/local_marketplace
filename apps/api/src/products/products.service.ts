import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Paginated, ProductSummaryDto } from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { CategoriesService } from '../categories/categories.service';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { UpdateProductDto, UpdateVariantDto } from './dto/update-product.dto';
import {
  toProductSummaryDto,
  type ProductForSummary,
  type ProductWithRelations,
} from './product.mapper';

const DETAIL_INCLUDE = {
  business: { select: { id: true, name: true, slug: true, logoUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  variants: true,
  images: true,
} satisfies Prisma.ProductInclude;

const SUMMARY_INCLUDE = {
  business: { select: { name: true, slug: true } },
  variants: true,
  images: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
    private readonly categories: CategoriesService,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateProductDto,
  ): Promise<ProductWithRelations> {
    const business = await this.businesses.findMine(userId);
    await this.categories.ensureExists(dto.categoryId);

    return this.prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description ?? '',
        slug: await this.uniqueSlug(dto.title),
        status: dto.status ?? 'ACTIVE',
        variants: {
          create: dto.variants.map((v, i) => ({
            sku: v.sku,
            attributes: v.attributes ?? {},
            priceCents: v.priceCents,
            stock: v.stock,
            isDefault: i === 0,
          })),
        },
        images: {
          create: (dto.images ?? []).map((url, i) => ({
            url,
            position: i,
          })),
        },
      },
      include: DETAIL_INCLUDE,
    });
  }

  async findPublicBySlug(slug: string): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: DETAIL_INCLUDE,
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }
    return product;
  }

  async listMine(userId: string): Promise<ProductWithRelations[]> {
    const business = await this.businesses.findMine(userId);
    return this.prisma.product.findMany({
      where: { businessId: business.id, status: { not: 'DELETED' } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductWithRelations> {
    await this.assertOwnership(userId, productId);
    if (dto.categoryId) {
      await this.categories.ensureExists(dto.categoryId);
    }
    const { images, ...fields } = dto;
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...fields,
        ...(images && {
          images: {
            deleteMany: {},
            create: images.map((url, i) => ({ url, position: i })),
          },
        }),
      },
      include: DETAIL_INCLUDE,
    });
  }

  async updateVariant(
    userId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductWithRelations> {
    await this.assertOwnership(userId, productId);
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException({
        code: 'VARIANT_NOT_FOUND',
        message: 'La variante no pertenece a este producto',
      });
    }
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
    return this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: DETAIL_INCLUDE,
    });
  }

  async softDelete(userId: string, productId: string): Promise<void> {
    await this.assertOwnership(userId, productId);
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'DELETED' },
    });
  }

  async search(query: SearchQueryDto): Promise<Paginated<ProductSummaryDto>> {
    const limit = query.limit ?? 20;
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

    if (query.q) {
      const matches = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products
        WHERE "searchVector" @@ websearch_to_tsquery('spanish', ${query.q})
          AND status = 'ACTIVE'
      `;
      where.id = { in: matches.map((m) => m.id) };
    }

    if (query.business) {
      where.business = { slug: query.business };
    }

    if (query.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
        include: { children: { select: { id: true } } },
      });
      if (!category) {
        return { items: [], nextCursor: null };
      }
      where.categoryId = {
        in: [category.id, ...category.children.map((c) => c.id)],
      };
    }

    if (
      query.minPriceCents !== undefined ||
      query.maxPriceCents !== undefined
    ) {
      where.variants = {
        some: {
          priceCents: {
            ...(query.minPriceCents !== undefined && {
              gte: query.minPriceCents,
            }),
            ...(query.maxPriceCents !== undefined && {
              lte: query.maxPriceCents,
            }),
          },
        },
      };
    }

    const products: ProductForSummary[] = await this.prisma.product.findMany({
      where,
      include: SUMMARY_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
    });

    const hasMore = products.length > limit;
    const page = hasMore ? products.slice(0, limit) : products;
    return {
      items: page.map(toProductSummaryDto),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  private async assertOwnership(
    userId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true, business: { select: { ownerId: true } } },
    });
    if (!product || product.status === 'DELETED') {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }
    if (product.business.ownerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_OWNER',
        message: 'El producto no pertenece a tu negocio',
      });
    }
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    for (let i = 2; ; i++) {
      const taken = await this.prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
      candidate = `${base}-${i}`;
    }
  }
}
