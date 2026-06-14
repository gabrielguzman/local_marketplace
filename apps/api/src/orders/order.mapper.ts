import type {
  Currency,
  OrderDto,
  OrderItemDto,
  SellerSubOrderDto,
  ShippingAddress,
  SubOrderDto,
} from '@marketplace/shared';
import type { Prisma } from '@prisma/client';

const ITEMS_INCLUDE = {
  include: { variant: { select: { productId: true } } },
} as const;

export const ORDER_INCLUDE = {
  payment: { select: { status: true } },
  subOrders: {
    include: {
      business: { select: { id: true, name: true, slug: true } },
      items: ITEMS_INCLUDE,
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

export const SELLER_SUB_ORDER_INCLUDE = {
  business: { select: { id: true, name: true, slug: true } },
  items: ITEMS_INCLUDE,
  order: {
    select: {
      id: true,
      createdAt: true,
      shippingAddress: true,
      buyer: { select: { name: true } },
    },
  },
} satisfies Prisma.SubOrderInclude;

export type SellerSubOrderWithRelations = Prisma.SubOrderGetPayload<{
  include: typeof SELLER_SUB_ORDER_INCLUDE;
}>;

type ItemRow = OrderWithRelations['subOrders'][number]['items'][number];

function toOrderItemDto(item: ItemRow): OrderItemDto {
  return {
    id: item.id,
    productId: item.variant.productId,
    title: item.titleSnapshot,
    attributes: (item.attributesSnapshot ?? {}) as Record<string, string>,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
  };
}

function toSubOrderDto(
  subOrder: OrderWithRelations['subOrders'][number],
): SubOrderDto {
  return {
    id: subOrder.id,
    status: subOrder.status,
    subtotalCents: subOrder.subtotalCents,
    shippingMethod: subOrder.shippingMethod,
    shippingCents: subOrder.shippingCents,
    business: subOrder.business,
    items: subOrder.items.map(toOrderItemDto),
  };
}

export function toOrderDto(order: OrderWithRelations): OrderDto {
  return {
    id: order.id,
    status: order.status,
    totalCents: order.totalCents,
    shippingCents: order.shippingCents,
    currency: order.currency as Currency,
    shippingAddress: order.shippingAddress as unknown as ShippingAddress,
    paymentStatus: order.payment?.status ?? null,
    createdAt: order.createdAt.toISOString(),
    subOrders: order.subOrders.map(toSubOrderDto),
  };
}

export function toSellerSubOrderDto(
  subOrder: SellerSubOrderWithRelations,
): SellerSubOrderDto {
  return {
    id: subOrder.id,
    status: subOrder.status,
    subtotalCents: subOrder.subtotalCents,
    shippingMethod: subOrder.shippingMethod,
    shippingCents: subOrder.shippingCents,
    business: subOrder.business,
    items: subOrder.items.map(toOrderItemDto),
    orderId: subOrder.order.id,
    createdAt: subOrder.order.createdAt.toISOString(),
    buyerName: subOrder.order.buyer.name,
    shippingAddress: subOrder.order
      .shippingAddress as unknown as ShippingAddress,
  };
}
