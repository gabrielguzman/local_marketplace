import { ConflictException, Injectable } from '@nestjs/common';
import type {
  AdminPayoutsView,
  PayoutDto,
  SellerPayoutSummary,
} from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

// neto al vendedor = subtotal − comisión + envío (el envío lo cobra el vendedor)
const NET_SUM = {
  subtotalCents: true,
  feeCents: true,
  shippingCents: true,
} satisfies Prisma.SubOrderSumAggregateInputType;

interface NetAgg {
  subtotalCents: number | null;
  feeCents: number | null;
  shippingCents: number | null;
}

function netOf(a: NetAgg | null): number {
  return (a?.subtotalCents ?? 0) - (a?.feeCents ?? 0) + (a?.shippingCents ?? 0);
}

type PayoutWithCount = Prisma.PayoutGetPayload<{
  include: { _count: { select: { subOrders: true } } };
}>;

function toPayoutDto(payout: PayoutWithCount): PayoutDto {
  return {
    id: payout.id,
    amountCents: payout.amountCents,
    note: payout.note,
    createdAt: payout.createdAt.toISOString(),
    salesCount: payout._count.subOrders,
  };
}

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
    private readonly notifications: NotificationsService,
  ) {}

  // Resumen de cobros del vendedor logueado
  async sellerSummary(userId: string): Promise<SellerPayoutSummary> {
    const business = await this.businesses.findMine(userId);
    const paid = {
      businessId: business.id,
      order: { status: 'PAID' as const },
    };

    const [available, pending, payouts] = await Promise.all([
      this.prisma.subOrder.aggregate({
        where: { ...paid, status: 'DELIVERED', payoutId: null },
        _sum: NET_SUM,
      }),
      this.prisma.subOrder.aggregate({
        where: {
          ...paid,
          status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] },
          payoutId: null,
        },
        _sum: NET_SUM,
      }),
      this.prisma.payout.findMany({
        where: { businessId: business.id },
        include: { _count: { select: { subOrders: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      availableCents: netOf(available._sum),
      pendingCents: netOf(pending._sum),
      paidCents: payouts.reduce((sum, p) => sum + p.amountCents, 0),
      payouts: payouts.map(toPayoutDto),
    };
  }

  // Panel admin: saldo a pagar por negocio + historial reciente
  async adminView(): Promise<AdminPayoutsView> {
    const grouped = await this.prisma.subOrder.groupBy({
      by: ['businessId'],
      where: { order: { status: 'PAID' }, status: 'DELIVERED', payoutId: null },
      _sum: NET_SUM,
      _count: true,
    });

    const businesses = await this.prisma.business.findMany({
      where: { id: { in: grouped.map((g) => g.businessId) } },
      select: { id: true, name: true, slug: true },
    });
    const byId = new Map(businesses.map((b) => [b.id, b]));

    const rows = grouped
      .map((g) => {
        const b = byId.get(g.businessId);
        return {
          businessId: g.businessId,
          businessName: b?.name ?? '—',
          businessSlug: b?.slug ?? '',
          availableCents: netOf(g._sum),
          salesCount: g._count,
        };
      })
      .filter((r) => r.availableCents > 0)
      .sort((a, b) => b.availableCents - a.availableCents);

    const recent = await this.prisma.payout.findMany({
      include: {
        business: { select: { name: true } },
        _count: { select: { subOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      rows,
      recent: recent.map((p) => ({
        ...toPayoutDto(p),
        businessName: p.business.name,
      })),
    };
  }

  // Registra una liquidación: paga todas las ventas entregadas sin liquidar
  async createPayout(businessId: string, note?: string): Promise<PayoutDto> {
    const payout = await this.prisma.$transaction(async (tx) => {
      const subs = await tx.subOrder.findMany({
        where: {
          businessId,
          order: { status: 'PAID' },
          status: 'DELIVERED',
          payoutId: null,
        },
        select: {
          id: true,
          subtotalCents: true,
          feeCents: true,
          shippingCents: true,
        },
      });
      if (subs.length === 0) {
        throw new ConflictException({
          code: 'NOTHING_TO_SETTLE',
          message: 'No hay ventas entregadas pendientes de liquidar',
        });
      }
      const amountCents = subs.reduce((sum, s) => sum + netOf(s), 0);
      const created = await tx.payout.create({
        data: { businessId, amountCents, note: note?.trim() || null },
        include: { _count: { select: { subOrders: true } } },
      });
      await tx.subOrder.updateMany({
        where: { id: { in: subs.map((s) => s.id) } },
        data: { payoutId: created.id },
      });
      return created;
    });

    // avisar al vendedor que se le acreditó la liquidación
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (business) {
      const pesos = (payout.amountCents / 100).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
      });
      await this.notifications.notify({
        userId: business.ownerId,
        type: 'PAYOUT',
        title: 'Se acreditó tu liquidación',
        body: `Te transferimos $${pesos} por tus ventas entregadas.`,
        link: '/vender/cobros',
      });
    }

    return toPayoutDto(payout);
  }
}
