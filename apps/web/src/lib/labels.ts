import type { OrderStatus, SubOrderStatus } from '@marketplace/shared';

export const ORDER_STATUS_LABEL: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING_PAYMENT: {
    label: 'Pago pendiente',
    className: 'bg-amber-50 text-amber-700',
  },
  PAID: { label: 'Pagada', className: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-50 text-red-600' },
  REFUNDED: { label: 'Reembolsada', className: 'bg-zinc-100 text-zinc-600' },
};

export const SUB_ORDER_STATUS_LABEL: Record<
  SubOrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pendiente de confirmación',
    className: 'bg-amber-50 text-amber-700',
  },
  CONFIRMED: { label: 'Confirmada', className: 'bg-blue-50 text-blue-700' },
  SHIPPED: { label: 'En camino', className: 'bg-brand-50 text-brand-700' },
  DELIVERED: { label: 'Entregada', className: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-50 text-red-600' },
};

// Transiciones que puede ejecutar el vendedor (espejo de la API)
export const SELLER_NEXT_ACTIONS: Record<
  SubOrderStatus,
  { status: SubOrderStatus; label: string }[]
> = {
  PENDING: [
    { status: 'CONFIRMED', label: 'Confirmar venta' },
    { status: 'CANCELLED', label: 'Cancelar' },
  ],
  CONFIRMED: [
    { status: 'SHIPPED', label: 'Marcar enviada' },
    { status: 'CANCELLED', label: 'Cancelar' },
  ],
  SHIPPED: [{ status: 'DELIVERED', label: 'Marcar entregada' }],
  DELIVERED: [],
  CANCELLED: [],
};
