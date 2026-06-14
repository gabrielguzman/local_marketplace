import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminBusinessDto,
  AdminMetricPoint,
  AdminOrderDetailDto,
  AdminOrderDto,
  AdminProductDto,
  AdminReviewDto,
  AdminStats,
  AdminUserDto,
  AuditLogDto,
  Currency,
  Page,
  ReportDto,
} from '@marketplace/shared';
import { ORDER_INCLUDE, toOrderDto } from '../orders/order.mapper';
import type {
  BusinessStatus,
  Prisma,
  ProductStatus,
  ReportStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REPORT_INCLUDE = {
  reporter: { select: { name: true } },
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      business: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ReportInclude;

type ReportWithRelations = Prisma.ReportGetPayload<{
  include: typeof REPORT_INCLUDE;
}>;

function toReportDto(report: ReportWithRelations): ReportDto {
  return {
    id: report.id,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reporterName: report.reporter.name,
    product: {
      id: report.product.id,
      title: report.product.title,
      slug: report.product.slug,
      status: report.product.status,
      businessName: report.product.business.name,
      businessId: report.product.business.id,
    },
  };
}

const PAGE_SIZE = 20;

// Normaliza el número de página (1-based) y calcula el offset
function paging(page?: number): { page: number; skip: number; take: number } {
  const current = Math.max(1, Math.floor(page ?? 1));
  return { page: current, skip: (current - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Registra una acción de moderación (fire-and-forget, no rompe la acción)
  private async audit(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    summary: string,
  ): Promise<void> {
    await this.prisma.auditLog
      .create({ data: { actorId, action, targetType, targetId, summary } })
      .catch(() => undefined);
  }

  async stats(): Promise<AdminStats> {
    const [users, businesses, activeProducts, paidOrders, pendingReports, gmv] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.business.count(),
        this.prisma.product.count({ where: { status: 'ACTIVE' } }),
        this.prisma.order.count({ where: { status: 'PAID' } }),
        this.prisma.report.count({ where: { status: 'PENDING' } }),
        this.prisma.order.aggregate({
          where: { status: 'PAID' },
          _sum: { totalCents: true },
        }),
      ]);
    return {
      users,
      businesses,
      activeProducts,
      paidOrders,
      pendingReports,
      gmvCents: gmv._sum.totalCents ?? 0,
    };
  }

  // ── Usuarios ─────────────────────────────────────────────

  async listUsers(q?: string, page?: number): Promise<Page<AdminUserDto>> {
    const { page: current, skip, take } = paging(page);
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { business: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      total,
      page: current,
      pageSize: PAGE_SIZE,
      items: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerifiedAt !== null,
        businessName: user.business?.name ?? null,
        createdAt: user.createdAt.toISOString(),
      })),
    };
  }

  async setUserRole(
    adminId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    if (adminId === userId) {
      throw new ConflictException({
        code: 'SELF_DEMOTE',
        message: 'No podés cambiar tu propio rol',
      });
    }
    await this.ensureUser(userId);
    await this.prisma.user.update({ where: { id: userId }, data: { role } });
    await this.audit(
      adminId,
      'USER_ROLE',
      'USER',
      userId,
      role === 'ADMIN' ? 'Dio acceso de admin' : 'Quitó acceso de admin',
    );
  }

  async setUserStatus(
    adminId: string,
    userId: string,
    status: UserStatus,
  ): Promise<void> {
    if (adminId === userId) {
      throw new ConflictException({
        code: 'SELF_SUSPEND',
        message: 'No podés suspender tu propia cuenta',
      });
    }
    await this.ensureUser(userId);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status } }),
      // matar las sesiones activas del usuario suspendido
      ...(status === 'SUSPENDED'
        ? [this.prisma.refreshToken.deleteMany({ where: { userId } })]
        : []),
    ]);
    await this.audit(
      adminId,
      'USER_STATUS',
      'USER',
      userId,
      status === 'SUSPENDED' ? 'Suspendió la cuenta' : 'Reactivó la cuenta',
    );
  }

  // ── Listados de moderación ───────────────────────────────

  async listBusinesses(
    q?: string,
    page?: number,
  ): Promise<Page<AdminBusinessDto>> {
    const { page: current, skip, take } = paging(page);
    const where: Prisma.BusinessWhereInput = q
      ? { name: { contains: q, mode: 'insensitive' } }
      : {};
    const [total, businesses] = await this.prisma.$transaction([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        include: {
          owner: { select: { email: true } },
          _count: {
            select: { products: { where: { status: { not: 'DELETED' } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      total,
      page: current,
      pageSize: PAGE_SIZE,
      items: businesses.map((business) => ({
        id: business.id,
        name: business.name,
        slug: business.slug,
        status: business.status,
        ownerEmail: business.owner.email,
        productCount: business._count.products,
        createdAt: business.createdAt.toISOString(),
      })),
    };
  }

  async listProducts(
    q?: string,
    page?: number,
  ): Promise<Page<AdminProductDto>> {
    const { page: current, skip, take } = paging(page);
    const where: Prisma.ProductWhereInput = {
      status: { not: 'DELETED' },
      ...(q && { title: { contains: q, mode: 'insensitive' } }),
    };
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          business: { select: { name: true } },
          variants: { where: { isDefault: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      total,
      page: current,
      pageSize: PAGE_SIZE,
      items: products.map((product) => ({
        id: product.id,
        title: product.title,
        slug: product.slug,
        status: product.status,
        businessName: product.business.name,
        priceCents: product.variants[0]?.priceCents ?? 0,
        createdAt: product.createdAt.toISOString(),
      })),
    };
  }

  async listOrders(page?: number): Promise<Page<AdminOrderDto>> {
    const { page: current, skip, take } = paging(page);
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        include: {
          buyer: { select: { email: true } },
          _count: { select: { subOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      total,
      page: current,
      pageSize: PAGE_SIZE,
      items: orders.map((order) => ({
        id: order.id,
        buyerEmail: order.buyer.email,
        totalCents: order.totalCents,
        currency: order.currency as Currency,
        status: order.status,
        subOrderCount: order._count.subOrders,
        createdAt: order.createdAt.toISOString(),
      })),
    };
  }

  // ── Moderación de reseñas denunciadas ────────────────────

  async listReportedReviews(): Promise<AdminReviewDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { reports: { some: {} } },
      include: {
        author: { select: { name: true } },
        product: { select: { title: true, slug: true } },
        _count: { select: { reports: true } },
      },
      orderBy: { reports: { _count: 'desc' } },
      take: 100,
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      authorName: r.author.name,
      productTitle: r.product.title,
      productSlug: r.product.slug,
      reportCount: r._count.reports,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async deleteReview(adminId: string, reviewId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });
    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Reseña no encontrada',
      });
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.audit(
      adminId,
      'REVIEW_DELETE',
      'REVIEW',
      reviewId,
      'Borró una reseña denunciada',
    );
  }

  async dismissReviewReports(adminId: string, reviewId: string): Promise<void> {
    await this.prisma.reviewReport.deleteMany({ where: { reviewId } });
    await this.audit(
      adminId,
      'REVIEW_DISMISS',
      'REVIEW',
      reviewId,
      'Desestimó las denuncias de una reseña',
    );
  }

  async getOrderDetail(orderId: string): Promise<AdminOrderDetailDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        ...ORDER_INCLUDE,
        buyer: { select: { email: true, name: true } },
      },
    });
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Orden no encontrada',
      });
    }
    return {
      ...toOrderDto(order),
      buyerEmail: order.buyer.email,
      buyerName: order.buyer.name,
    };
  }

  private async ensureUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      });
    }
  }

  async listReports(status?: ReportStatus): Promise<ReportDto[]> {
    const reports = await this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return reports.map(toReportDto);
  }

  async resolveReport(
    adminId: string,
    reportId: string,
    status: 'RESOLVED' | 'DISMISSED',
  ): Promise<ReportDto> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException({
        code: 'REPORT_NOT_FOUND',
        message: 'Denuncia no encontrada',
      });
    }
    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
      include: REPORT_INCLUDE,
    });
    await this.audit(
      adminId,
      'REPORT_RESOLVE',
      'REPORT',
      reportId,
      status === 'RESOLVED'
        ? 'Resolvió una denuncia'
        : 'Desestimó una denuncia',
    );
    return toReportDto(updated);
  }

  // Moderación: el admin puede pausar/eliminar cualquier producto
  async setProductStatus(
    adminId: string,
    productId: string,
    status: ProductStatus,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { title: true },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }
    await this.prisma.product.update({
      where: { id: productId },
      data: { status },
    });
    await this.audit(
      adminId,
      'PRODUCT_STATUS',
      'PRODUCT',
      productId,
      `Cambió "${product.title}" a ${status}`,
    );
  }

  async setBusinessStatus(
    adminId: string,
    businessId: string,
    status: BusinessStatus,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Negocio no encontrado',
      });
    }
    await this.prisma.business.update({
      where: { id: businessId },
      data: { status },
    });
    await this.audit(
      adminId,
      'BUSINESS_STATUS',
      'BUSINESS',
      businessId,
      `Cambió "${business.name}" a ${status}`,
    );
  }

  async listAudit(page?: number): Promise<Page<AuditLogDto>> {
    const { page: current, skip, take } = paging(page);
    const [total, logs] = await this.prisma.$transaction([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      total,
      page: current,
      pageSize: PAGE_SIZE,
      items: logs.map((log) => ({
        id: log.id,
        actorName: log.actor.name,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        summary: log.summary,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  // Serie diaria de los últimos 14 días (órdenes pagadas y facturación)
  async metrics(): Promise<AdminMetricPoint[]> {
    const rows = await this.prisma.$queryRaw<
      { date: string; orders: bigint; revenue: bigint }[]
    >`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
             count(*) AS orders,
             coalesce(sum("totalCents"), 0) AS revenue
      FROM orders
      WHERE status = 'PAID'
        AND "createdAt" >= (now() - interval '13 days')::date
      GROUP BY 1
    `;
    const byDate = new Map(
      rows.map((r) => [
        r.date,
        { orders: Number(r.orders), revenueCents: Number(r.revenue) },
      ]),
    );

    // rellenar los 14 días (más viejo → más nuevo), incluso los vacíos
    const points: AdminMetricPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      const hit = byDate.get(date);
      points.push({
        date,
        orders: hit?.orders ?? 0,
        revenueCents: hit?.revenueCents ?? 0,
      });
    }
    return points;
  }
}
