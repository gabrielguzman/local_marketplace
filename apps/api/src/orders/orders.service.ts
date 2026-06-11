import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  OrderDto,
  SellerDashboard,
  SellerSubOrderDto,
} from '@marketplace/shared';
import type { SubOrderStatus } from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/orders.dto';
import {
  ORDER_INCLUDE,
  SELLER_SUB_ORDER_INCLUDE,
  toOrderDto,
  toSellerSubOrderDto,
} from './order.mapper';

// Transiciones válidas para el vendedor
const SUB_ORDER_FLOW: Record<SubOrderStatus, SubOrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  // Crea la orden (PENDING_PAYMENT) desde el carrito y lo vacía.
  // El stock NO se descuenta acá: se descuenta al aprobarse el pago.
  async checkout(userId: string, dto: CheckoutDto): Promise<OrderDto> {
    const order = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { title: true, status: true, businessId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException({
          code: 'EMPTY_CART',
          message: 'Tu carrito está vacío',
        });
      }

      for (const item of cart.items) {
        if (item.variant.product.status !== 'ACTIVE') {
          throw new ConflictException({
            code: 'PRODUCT_UNAVAILABLE',
            message: `"${item.variant.product.title}" ya no está disponible`,
          });
        }
        if (item.quantity > item.variant.stock) {
          throw new ConflictException({
            code: 'INSUFFICIENT_STOCK',
            message: `No hay stock suficiente de "${item.variant.product.title}"`,
          });
        }
      }

      // Agrupar por negocio → sub-órdenes
      const byBusiness = new Map<string, typeof cart.items>();
      for (const item of cart.items) {
        const key = item.variant.product.businessId;
        byBusiness.set(key, [...(byBusiness.get(key) ?? []), item]);
      }

      const totalCents = cart.items.reduce(
        (sum, i) => sum + i.variant.priceCents * i.quantity,
        0,
      );

      const created = await tx.order.create({
        data: {
          buyerId: userId,
          totalCents,
          shippingAddress: { ...dto },
          payment: { create: { amountCents: totalCents } },
          subOrders: {
            create: [...byBusiness.entries()].map(([businessId, items]) => ({
              businessId,
              subtotalCents: items.reduce(
                (sum, i) => sum + i.variant.priceCents * i.quantity,
                0,
              ),
              items: {
                create: items.map((item) => ({
                  variantId: item.variantId,
                  quantity: item.quantity,
                  unitPriceCents: item.variant.priceCents,
                  titleSnapshot: item.variant.product.title,
                  attributesSnapshot: item.variant.attributes ?? {},
                })),
              },
            })),
          },
        },
        include: ORDER_INCLUDE,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return toOrderDto(order);
  }

  // Pago simulado: cumple el rol que tendrá el webhook de MercadoPago.
  // Descuenta stock de forma atómica; si no alcanza, cancela la orden.
  async payOrder(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { subOrders: { include: { items: true } } },
    });
    if (!order || order.buyerId !== userId) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Orden no encontrada',
      });
    }
    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictException({
        code: 'ORDER_NOT_PAYABLE',
        message: 'La orden ya fue procesada',
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const subOrder of order.subOrders) {
          for (const item of subOrder.items) {
            const result = await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (result.count === 0) {
              throw new ConflictException({
                code: 'INSUFFICIENT_STOCK',
                message: `Se agotó el stock de "${item.titleSnapshot}" antes de completarse el pago`,
              });
            }
          }
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });
        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: 'APPROVED', providerPaymentId: `sim-${order.id}` },
        });
      });
    } catch (err) {
      // El pago falló por stock: la orden queda cancelada
      if (err instanceof ConflictException) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            payment: { update: { status: 'REJECTED' } },
            subOrders: {
              updateMany: { where: {}, data: { status: 'CANCELLED' } },
            },
          },
        });
      }
      throw err;
    }

    return this.getMyOrder(userId, orderId);
  }

  async listMyOrders(userId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderDto);
  }

  async getMyOrder(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order || order.buyerId !== userId) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Orden no encontrada',
      });
    }
    return toOrderDto(order);
  }

  async sellerDashboard(userId: string): Promise<SellerDashboard> {
    const business = await this.businesses.findMine(userId);
    const paidSales = {
      businessId: business.id,
      order: { status: 'PAID' as const },
    };

    const [
      revenue,
      pendingSalesCount,
      activeProducts,
      lowStockVariants,
      recent,
    ] = await this.prisma.$transaction([
      this.prisma.subOrder.aggregate({
        where: { ...paidSales, status: { not: 'CANCELLED' } },
        _sum: { subtotalCents: true },
        _count: true,
      }),
      this.prisma.subOrder.count({
        where: { ...paidSales, status: { in: ['PENDING', 'CONFIRMED'] } },
      }),
      this.prisma.product.count({
        where: { businessId: business.id, status: 'ACTIVE' },
      }),
      this.prisma.productVariant.count({
        where: {
          stock: { lte: 3 },
          product: { businessId: business.id, status: 'ACTIVE' },
        },
      }),
      this.prisma.subOrder.findMany({
        where: paidSales,
        include: SELLER_SUB_ORDER_INCLUDE,
        orderBy: { order: { createdAt: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      revenueCents: revenue._sum.subtotalCents ?? 0,
      salesCount: revenue._count,
      pendingSalesCount,
      activeProducts,
      lowStockVariants,
      recentSales: recent.map(toSellerSubOrderDto),
    };
  }

  // El vendedor ve sus ventas recién cuando la orden está pagada
  async listMySales(userId: string): Promise<SellerSubOrderDto[]> {
    const business = await this.businesses.findMine(userId);
    const subOrders = await this.prisma.subOrder.findMany({
      where: {
        businessId: business.id,
        order: { status: { in: ['PAID', 'REFUNDED'] } },
      },
      include: SELLER_SUB_ORDER_INCLUDE,
      orderBy: { order: { createdAt: 'desc' } },
    });
    return subOrders.map(toSellerSubOrderDto);
  }

  async updateSubOrderStatus(
    userId: string,
    subOrderId: string,
    status: SubOrderStatus,
  ): Promise<SellerSubOrderDto> {
    const business = await this.businesses.findMine(userId);
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { order: { select: { status: true } } },
    });
    if (!subOrder || subOrder.businessId !== business.id) {
      throw new NotFoundException({
        code: 'SUB_ORDER_NOT_FOUND',
        message: 'Venta no encontrada',
      });
    }
    if (subOrder.order.status !== 'PAID') {
      throw new ForbiddenException({
        code: 'ORDER_NOT_PAID',
        message: 'La orden todavía no está pagada',
      });
    }
    if (!SUB_ORDER_FLOW[subOrder.status].includes(status)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `No se puede pasar de ${subOrder.status} a ${status}`,
      });
    }

    const updated = await this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status },
      include: SELLER_SUB_ORDER_INCLUDE,
    });
    return toSellerSubOrderDto(updated);
  }
}
