import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminBusinessDto,
  AdminOrderDetailDto,
  AdminOrderDto,
  AdminProductDto,
  AdminStats,
  AdminUserDto,
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
    return toReportDto(updated);
  }

  // Moderación: el admin puede pausar/eliminar cualquier producto
  async setProductStatus(
    productId: string,
    status: ProductStatus,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
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
  }

  async setBusinessStatus(
    businessId: string,
    status: BusinessStatus,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
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
  }
}
