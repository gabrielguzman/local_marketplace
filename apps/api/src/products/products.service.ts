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
  SearchFacets,
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
        brand: dto.brand?.trim() || null,
        condition: dto.condition ?? 'NEW',
        specs: (dto.specs ?? []) as unknown as Prisma.InputJsonValue,
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

  // Clona un producto como borrador: copia ficha, variantes (stock en 0) e
  // imágenes. Útil para publicar productos parecidos sin cargar todo de nuevo.
  async duplicate(
    userId: string,
    productId: string,
  ): Promise<ProductWithRelations> {
    await this.assertOwnership(userId, productId);
    const source = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: { variants: { orderBy: { isDefault: 'desc' } }, images: true },
    });

    const title = `${source.title} (copia)`;
    return this.prisma.product.create({
      data: {
        businessId: source.businessId,
        categoryId: source.categoryId,
        title,
        description: source.description,
        brand: source.brand,
        condition: source.condition,
        specs: source.specs as unknown as Prisma.InputJsonValue,
        slug: await this.uniqueSlug(title),
        status: 'DRAFT',
        variants: {
          create: source.variants.map((v, i) => ({
            sku: v.sku ? `${v.sku}-copia` : null,
            attributes: v.attributes as unknown as Prisma.InputJsonValue,
            priceCents: v.priceCents,
            stock: 0,
            isDefault: i === 0,
          })),
        },
        images: {
          create: source.images.map((img) => ({
            url: img.url,
            position: img.position,
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
    const { images, specs, brand, ...fields } = dto;
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...fields,
        ...(brand !== undefined && { brand: brand.trim() || null }),
        ...(specs && { specs: specs as unknown as Prisma.InputJsonValue }),
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

  // Más vendidos: por unidades vendidas en órdenes pagadas
  async bestSellers(limit = 8): Promise<ProductSummaryDto[]> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT v."productId" AS id
      FROM order_items oi
      JOIN product_variants v ON v.id = oi."variantId"
      JOIN sub_orders so ON so.id = oi."subOrderId"
      JOIN orders o ON o.id = so."orderId"
      JOIN products p ON p.id = v."productId"
      WHERE o.status = 'PAID' AND p.status = 'ACTIVE'
      GROUP BY v."productId"
      ORDER BY SUM(oi.quantity) DESC
      LIMIT ${limit}
    `;
    return this.summariesInOrder(rows.map((r) => r.id));
  }

  // Productos por slug (para "vistos recientemente"), preservando el orden
  async bySlugs(slugs: string[]): Promise<ProductSummaryDto[]> {
    const clean = slugs.filter(Boolean).slice(0, 12);
    if (clean.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { slug: { in: clean }, status: 'ACTIVE' },
      include: SUMMARY_INCLUDE,
    });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return this.toSummaries(clean.flatMap((s) => bySlug.get(s) ?? []));
  }

  private async summariesInOrder(ids: string[]): Promise<ProductSummaryDto[]> {
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: SUMMARY_INCLUDE,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return this.toSummaries(ids.flatMap((id) => byId.get(id) ?? []));
  }

  // Marcas disponibles (faceta del buscador), opcionalmente por categoría
  async brands(categorySlug?: string): Promise<string[]> {
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      brand: { not: null },
    };
    if (categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: { select: { id: true } } },
      });
      if (!category) return [];
      where.categoryId = {
        in: [category.id, ...category.children.map((c) => c.id)],
      };
    }
    const rows = await this.prisma.product.findMany({
      where,
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
      take: 30,
    });
    return rows.map((r) => r.brand).filter((b): b is string => Boolean(b));
  }

  // ids que matchean el texto, ya ordenados por ts_rank (más relevante primero).
  // Combina título + descripción + marca + atributos de variantes + ficha técnica.
  private async textMatchIds(q: string): Promise<string[]> {
    const matches = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM products p
      LEFT JOIN LATERAL (
        SELECT string_agg(av.value, ' ') AS attrs
        FROM product_variants v
        CROSS JOIN LATERAL jsonb_each_text(v.attributes::jsonb) AS av(key, value)
        WHERE v."productId" = p.id
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT string_agg(spec->>'value', ' ') AS specs
        FROM jsonb_array_elements(p.specs::jsonb) AS spec
      ) s ON true
      WHERE p.status = 'ACTIVE'
        AND to_tsvector('spanish',
              COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') ||
              ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(a.attrs, '') ||
              ' ' || COALESCE(s.specs, ''))
            @@ websearch_to_tsquery('spanish', ${q})
      ORDER BY ts_rank(
              to_tsvector('spanish',
                COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') ||
                ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(a.attrs, '') ||
                ' ' || COALESCE(s.specs, '')),
              websearch_to_tsquery('spanish', ${q})) DESC,
        p.id DESC
    `;
    return matches.map((m) => m.id);
  }

  // Where del conjunto que matchea la búsqueda, aplicando todos los filtros
  // activos MENOS el indicado en `ignore` (así esa faceta puede ofrecer
  // alternativas). Devuelve null si la categoría pedida no existe.
  private async facetWhere(
    query: SearchQueryDto,
    ignore: 'brand' | 'category' | 'condition' | 'rating' | null,
    textIds: string[] | null,
  ): Promise<Prisma.ProductWhereInput | null> {
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

    if (textIds) where.id = { in: textIds };
    if (query.condition && ignore !== 'condition') {
      where.condition = query.condition;
    }
    if (query.brand && ignore !== 'brand') where.brand = query.brand;
    if (query.business) where.business = { slug: query.business };

    if (query.category && ignore !== 'category') {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
        include: { children: { select: { id: true } } },
      });
      if (!category) return null;
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

    if (query.minRating && ignore !== 'rating') {
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
    }

    return where;
  }

  // Facetas dinámicas para la búsqueda actual: marcas, categorías, condición
  // y calificación presentes en los resultados (cada una ignora su filtro).
  async facets(query: SearchQueryDto): Promise<SearchFacets> {
    // el match por texto se calcula una vez y se reusa en cada faceta
    const textIds = query.q ? await this.textMatchIds(query.q) : null;

    const [brandWhere, catWhere, condWhere, ratingWhere] = await Promise.all([
      this.facetWhere(query, 'brand', textIds),
      this.facetWhere(query, 'category', textIds),
      this.facetWhere(query, 'condition', textIds),
      this.facetWhere(query, 'rating', textIds),
    ]);

    const brands = brandWhere
      ? (
          await this.prisma.product.findMany({
            where: { ...brandWhere, brand: { not: null } },
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
            take: 40,
          })
        )
          .map((r) => r.brand)
          .filter((b): b is string => Boolean(b))
      : [];

    let categories: SearchFacets['categories'] = [];
    if (catWhere) {
      const grouped = await this.prisma.product.groupBy({
        by: ['categoryId'],
        where: catWhere,
        _count: true,
      });
      if (grouped.length > 0) {
        const all = await this.prisma.category.findMany({
          select: { id: true, name: true, slug: true, parentId: true },
        });
        const byId = new Map(all.map((c) => [c.id, c]));
        // sumar al nivel del padre (el sidebar lista categorías raíz)
        const counts = new Map<string, number>();
        for (const g of grouped) {
          const cat = byId.get(g.categoryId);
          if (!cat) continue;
          const root = cat.parentId ? (byId.get(cat.parentId) ?? cat) : cat;
          counts.set(root.id, (counts.get(root.id) ?? 0) + g._count);
        }
        categories = [...counts.entries()]
          .map(([id, count]) => {
            const cat = byId.get(id)!;
            return { id, name: cat.name, slug: cat.slug, count };
          })
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      }
    }

    let conditions: SearchFacets['conditions'] = [];
    if (condWhere) {
      const grouped = await this.prisma.product.groupBy({
        by: ['condition'],
        where: condWhere,
        _count: true,
      });
      conditions = grouped
        .map((g) => ({ value: g.condition, count: g._count }))
        .sort((a, b) => b.count - a.count);
    }

    // calificación: cuántos productos del set tienen promedio ≥ 4 / 3 / 2
    let ratings: SearchFacets['ratings'] = [];
    if (ratingWhere) {
      const matched = await this.prisma.product.findMany({
        where: ratingWhere,
        select: { id: true },
      });
      if (matched.length > 0) {
        const avgs = await this.prisma.review.groupBy({
          by: ['productId'],
          where: { productId: { in: matched.map((m) => m.id) } },
          _avg: { rating: true },
        });
        ratings = [4, 3, 2]
          .map((min) => ({
            min,
            count: avgs.filter((a) => (a._avg.rating ?? 0) >= min).length,
          }))
          .filter((r) => r.count > 0);
      }
    }

    return { brands, categories, conditions, ratings };
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
      rankedIds = await this.textMatchIds(query.q);
      where.id = { in: rankedIds };
    }

    if (query.condition) {
      where.condition = query.condition;
    }

    if (query.brand) {
      where.brand = query.brand;
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
