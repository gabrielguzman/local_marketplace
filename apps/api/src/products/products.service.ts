import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Paginated,
  ProductSummaryDto,
  RatingSummary,
  SearchSuggestion,
} from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { CategoriesService } from '../categories/categories.service';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
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

  async addVariant(
    userId: string,
    productId: string,
    dto: CreateVariantDto,
  ): Promise<ProductWithRelations> {
    await this.assertOwnership(userId, productId);
    await this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        attributes: dto.attributes ?? {},
        priceCents: dto.priceCents,
        stock: dto.stock,
      },
    });
    return this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: DETAIL_INCLUDE,
    });
  }

  async deleteVariant(
    userId: string,
    productId: string,
    variantId: string,
  ): Promise<ProductWithRelations> {
    await this.assertOwnership(userId, productId);
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true, isDefault: true },
    });
    const target = variants.find((v) => v.id === variantId);
    if (!target) {
      throw new NotFoundException({
        code: 'VARIANT_NOT_FOUND',
        message: 'La variante no pertenece a este producto',
      });
    }
    if (variants.length === 1) {
      throw new ConflictException({
        code: 'LAST_VARIANT',
        message: 'El producto necesita al menos una variante',
      });
    }

    try {
      await this.prisma.productVariant.delete({ where: { id: variantId } });
    } catch {
      // FK restrict: la variante tiene ventas históricas
      throw new ConflictException({
        code: 'VARIANT_HAS_ORDERS',
        message:
          'Esta variante tiene ventas y no se puede borrar. Dejala con stock 0 para que no se venda más.',
      });
    }

    if (target.isDefault) {
      const next = variants.find((v) => v.id !== variantId);
      if (next) {
        await this.prisma.productVariant.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
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

  async ratingFor(productId: string): Promise<RatingSummary> {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    return {
      avg: agg._avg.rating === null ? null : Number(agg._avg.rating.toFixed(1)),
      count: agg._count,
    };
  }

  // Sugerencias para el autocompletado: títulos que contienen el texto
  async suggest(q: string): Promise<SearchSuggestion[]> {
    const term = q.trim();
    if (term.length < 2) return [];
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        title: { contains: term, mode: 'insensitive' },
      },
      select: { title: true, slug: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    return products;
  }

  async search(query: SearchQueryDto): Promise<Paginated<ProductSummaryDto>> {
    const limit = query.limit ?? 20;
    // 'relevance' solo tiene sentido con texto de búsqueda
    const sort =
      query.sort === 'relevance' && !query.q
        ? 'recent'
        : (query.sort ?? 'recent');
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

    // ids ordenados por ts_rank, para cuando sort === 'relevance'.
    // El tsvector se calcula combinando título + descripción + los valores
    // de los atributos de las variantes, así "remera roja" matchea el color.
    let rankedIds: string[] = [];
    if (query.q) {
      const matches = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        LEFT JOIN LATERAL (
          SELECT string_agg(av.value, ' ') AS attrs
          FROM product_variants v
          CROSS JOIN LATERAL jsonb_each_text(v.attributes::jsonb) AS av(key, value)
          WHERE v."productId" = p.id
        ) a ON true
        WHERE p.status = 'ACTIVE'
          AND to_tsvector('spanish',
                COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') ||
                ' ' || COALESCE(a.attrs, ''))
              @@ websearch_to_tsquery('spanish', ${query.q})
        ORDER BY ts_rank(
                to_tsvector('spanish',
                  COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') ||
                  ' ' || COALESCE(a.attrs, '')),
                websearch_to_tsquery('spanish', ${query.q})) DESC,
          p.id DESC
      `;
      rankedIds = matches.map((m) => m.id);
      where.id = { in: rankedIds };
    }

    // filtro por calificación: productos cuyo promedio de reseñas ≥ minRating
    if (query.minRating) {
      const rated = await this.prisma.review.groupBy({
        by: ['productId'],
        _avg: { rating: true },
        having: { rating: { _avg: { gte: query.minRating } } },
      });
      const ratedIds = new Set(rated.map((r) => r.productId));
      const existing =
        where.id && typeof where.id === 'object' && 'in' in where.id
          ? (where.id.in as string[])
          : null;
      where.id = {
        in: existing
          ? existing.filter((id) => ratedIds.has(id))
          : [...ratedIds],
      };
      rankedIds = rankedIds.filter((id) => ratedIds.has(id));
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

    if (sort === 'recent') {
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
        items: await this.toSummaries(page),
        nextCursor: hasMore ? page[page.length - 1].id : null,
      };
    }

    // precio/relevancia: el orden no se puede expresar con el cursor nativo
    // de Prisma (vive en la variante default / en ts_rank), así que se ordena
    // el conjunto filtrado de ids y se pagina por posición.
    const filtered = await this.prisma.product.findMany({
      where,
      select: { id: true },
    });

    let ordered: string[];
    if (sort === 'relevance') {
      const surviving = new Set(filtered.map((f) => f.id));
      ordered = rankedIds.filter((id) => surviving.has(id));
    } else {
      const defaults = await this.prisma.productVariant.findMany({
        where: {
          productId: { in: filtered.map((f) => f.id) },
          isDefault: true,
        },
        select: { productId: true, priceCents: true },
      });
      const priceOf = new Map(defaults.map((v) => [v.productId, v.priceCents]));
      const dir = sort === 'price_desc' ? -1 : 1;
      ordered = filtered
        .map((f) => f.id)
        .sort(
          (a, b) =>
            dir * ((priceOf.get(a) ?? 0) - (priceOf.get(b) ?? 0)) ||
            a.localeCompare(b),
        );
    }

    const start = query.cursor ? ordered.indexOf(query.cursor) + 1 : 0;
    const pageIds = ordered.slice(start, start + limit);
    const products = await this.prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: SUMMARY_INCLUDE,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const page = pageIds.flatMap((id) => byId.get(id) ?? []);

    return {
      items: await this.toSummaries(page),
      nextCursor:
        start + limit < ordered.length ? pageIds[pageIds.length - 1] : null,
    };
  }

  // Resuelve los ratings de la página en una sola consulta agrupada
  private async toSummaries(
    products: ProductForSummary[],
  ): Promise<ProductSummaryDto[]> {
    if (products.length === 0) return [];
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
