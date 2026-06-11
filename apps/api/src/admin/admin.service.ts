import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminStats, ReportDto } from '@marketplace/shared';
import type {
  BusinessStatus,
  Prisma,
  ProductStatus,
  ReportStatus,
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

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(): Promise<AdminStats> {
    const [users, businesses, activeProducts, paidOrders, pendingReports] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.business.count(),
        this.prisma.product.count({ where: { status: 'ACTIVE' } }),
        this.prisma.order.count({ where: { status: 'PAID' } }),
        this.prisma.report.count({ where: { status: 'PENDING' } }),
      ]);
    return { users, businesses, activeProducts, paidOrders, pendingReports };
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
