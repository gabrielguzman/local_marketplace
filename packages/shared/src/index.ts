// Tipos compartidos entre la API (NestJS) y el frontend (Next.js).
// Regla: acá van contratos de la API (responses, enums, errores),
// nunca lógica de negocio.

// ── Salud ────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok';
  db: 'up' | 'down';
  timestamp: string;
}

// ── Enums de dominio (espejo del schema de Prisma) ───────

export const BUSINESS_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'DELETED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SUB_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type SubOrderStatus = (typeof SUB_ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ── Auth y usuarios ──────────────────────────────────────

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// El refresh token viaja aparte, en cookie httpOnly
export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

// ── Negocios ─────────────────────────────────────────────

export interface BusinessDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: BusinessStatus;
  createdAt: string;
}

// ── Catálogo ─────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  children: CategoryDto[];
}

export interface ProductVariantDto {
  id: string;
  sku: string | null;
  attributes: Record<string, string>;
  priceCents: number;
  currency: Currency;
  stock: number;
  isDefault: boolean;
}

export interface ProductImageDto {
  id: string;
  url: string;
  position: number;
}

export interface ProductDetailDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ProductStatus;
  category: { id: string; name: string; slug: string };
  business: { id: string; name: string; slug: string; logoUrl: string | null };
  variants: ProductVariantDto[];
  images: ProductImageDto[];
  createdAt: string;
}

// Para listados (búsqueda, home, página de negocio)
export interface ProductSummaryDto {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: Currency;
  imageUrl: string | null;
  businessName: string;
  businessSlug: string;
}

// ── Carrito ──────────────────────────────────────────────

export interface CartItemDto {
  id: string;
  quantity: number;
  variant: {
    id: string;
    priceCents: number;
    currency: Currency;
    attributes: Record<string, string>;
    stock: number;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    status: ProductStatus;
    imageUrl: string | null;
  };
  business: { id: string; name: string; slug: string };
}

export interface CartDto {
  items: CartItemDto[];
  totalCents: number;
  currency: Currency;
}

// ── Órdenes ──────────────────────────────────────────────

export interface ShippingAddress {
  street: string;
  number: string;
  city: string;
  province: string;
  zipCode: string;
}

export interface OrderItemDto {
  id: string;
  title: string;
  attributes: Record<string, string>;
  quantity: number;
  unitPriceCents: number;
}

export interface SubOrderDto {
  id: string;
  status: SubOrderStatus;
  subtotalCents: number;
  business: { id: string; name: string; slug: string };
  items: OrderItemDto[];
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: Currency;
  shippingAddress: ShippingAddress;
  paymentStatus: PaymentStatus | null;
  createdAt: string;
  subOrders: SubOrderDto[];
}

// Vista del vendedor: una sub-orden con contexto de la orden madre
export interface SellerSubOrderDto extends SubOrderDto {
  orderId: string;
  createdAt: string;
  buyerName: string;
  shippingAddress: ShippingAddress;
}

// ── Convenciones de la API ───────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

// ── Dinero ───────────────────────────────────────────────
// Siempre centavos (int) + moneda explícita.

export type Currency = 'ARS';

export interface Money {
  amountCents: number;
  currency: Currency;
}
