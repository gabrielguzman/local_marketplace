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

export const PRODUCT_CONDITIONS = ['NEW', 'USED'] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  NEW: 'Nuevo',
  USED: 'Usado',
};

// Una fila de la ficha técnica
export interface ProductSpec {
  key: string;
  value: string;
}

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

export const SHIPPING_METHODS = ['PICKUP', 'SHIPPING', 'TO_AGREE'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  PICKUP: 'Retiro en persona',
  SHIPPING: 'Envío a domicilio',
  TO_AGREE: 'A coordinar con el vendedor',
};

export const PAYMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Comisión de la plataforma: % sobre el subtotal de productos de cada
// sub-orden (el envío lo cobra entero el vendedor). Fuente única de verdad
// para el cálculo (API) y para mostrarla (web).
export const PLATFORM_FEE_PERCENT = 10;

export function platformFeeCents(subtotalCents: number): number {
  return Math.round((subtotalCents * PLATFORM_FEE_PERCENT) / 100);
}

// ── Auth y usuarios ──────────────────────────────────────

export const USER_ROLES = ['USER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

// El refresh token viaja aparte, en cookie httpOnly
export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

// ── Direcciones ──────────────────────────────────────────

export interface AddressDto {
  id: string;
  street: string;
  number: string;
  city: string;
  province: string;
  zipCode: string;
  isDefault: boolean;
}

// ── Negocios ─────────────────────────────────────────────

export interface BusinessDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  hours: string | null;
  policies: string | null;
  pickupEnabled: boolean;
  shippingCents: number | null;
  status: BusinessStatus;
  rating: RatingSummary;
  createdAt: string;
  stats?: BusinessStats;
}

// Métricas públicas que se muestran en el perfil de la tienda
export interface BusinessStats {
  productCount: number;
  salesCount: number;
}

// ── Catálogo ─────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  children: CategoryDto[];
}

// Categoría con contexto de navegación (para /c/[slug])
export interface CategoryDetailDto {
  id: string;
  name: string;
  slug: string;
  parent: { name: string; slug: string } | null;
  children: { id: string; name: string; slug: string }[];
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
  brand: string | null;
  condition: ProductCondition;
  specs: ProductSpec[];
  status: ProductStatus;
  category: { id: string; name: string; slug: string };
  business: { id: string; name: string; slug: string; logoUrl: string | null };
  variants: ProductVariantDto[];
  images: ProductImageDto[];
  rating: RatingSummary;
  createdAt: string;
}

// Para listados (búsqueda, home, página de negocio)
export interface ProductSummaryDto {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: Currency;
  condition: ProductCondition;
  imageUrl: string | null;
  businessName: string;
  businessSlug: string;
  rating: RatingSummary;
}

// Sugerencia de autocompletado del buscador
export interface SearchSuggestion {
  title: string;
  slug: string;
}

// Facetas dinámicas: marcas, categorías, condición y calificación presentes
// en los resultados de la búsqueda actual (cada faceta ignora su propio
// filtro activo, para poder cambiar de opción sin perder el resto).
export interface SearchFacets {
  brands: string[];
  categories: { id: string; name: string; slug: string; count: number }[];
  conditions: { value: ProductCondition; count: number }[];
  ratings: { min: number; count: number }[];
}

// Ordenamientos de /search ('relevance' requiere `q`)
export const SEARCH_SORTS = [
  'recent',
  'price_asc',
  'price_desc',
  'relevance',
] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

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
  business: {
    id: string;
    name: string;
    slug: string;
    pickupEnabled: boolean;
    shippingCents: number | null;
  };
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
  productId: string;
  title: string;
  attributes: Record<string, string>;
  quantity: number;
  unitPriceCents: number;
}

export interface SubOrderDto {
  id: string;
  status: SubOrderStatus;
  subtotalCents: number; // sólo productos
  shippingMethod: ShippingMethod;
  shippingCents: number;
  feeCents: number; // comisión de la plataforma sobre el subtotal
  trackingCode: string | null;
  cancelReason: string | null;
  business: { id: string; name: string; slug: string };
  items: OrderItemDto[];
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  totalCents: number; // productos + envío
  shippingCents: number;
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

// ── Confianza: reseñas y denuncias ───────────────────────

export interface RatingSummary {
  avg: number | null; // null si no hay reseñas
  count: number;
}

export interface ReviewDto {
  id: string;
  productId: string;
  authorId: string;
  rating: number; // 1..5
  comment: string;
  authorName: string;
  createdAt: string;
  sellerResponse: string | null;
  sellerRespondedAt: string | null;
  helpfulCount: number; // cuántos la marcaron "útil"
  votedHelpful: boolean; // si el que mira ya la votó
}

// Pregunta pública sobre un producto (con respuesta del vendedor)
export interface QuestionDto {
  id: string;
  body: string;
  answer: string | null;
  answeredAt: string | null;
  authorName: string;
  authorId: string;
  createdAt: string;
}

// Mi actividad (reseñas y preguntas que hice), con el producto al que apuntan
export interface MyReviewDto {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  sellerResponse: string | null;
  productTitle: string;
  productSlug: string;
}

export interface MyQuestionDto {
  id: string;
  body: string;
  answer: string | null;
  createdAt: string;
  productTitle: string;
  productSlug: string;
}

export const REPORT_REASONS = [
  'SPAM',
  'PROHIBITED',
  'COUNTERFEIT',
  'OFFENSIVE',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam o publicidad engañosa',
  PROHIBITED: 'Producto prohibido',
  COUNTERFEIT: 'Falsificación',
  OFFENSIVE: 'Contenido ofensivo',
  OTHER: 'Otro motivo',
};

export const REPORT_STATUSES = ['PENDING', 'RESOLVED', 'DISMISSED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface ReportDto {
  id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
  reporterName: string;
  product: {
    id: string;
    title: string;
    slug: string;
    status: ProductStatus;
    businessName: string;
    businessId: string;
  };
}

// ── Admin ────────────────────────────────────────────────

export interface AdminStats {
  users: number;
  businesses: number;
  activeProducts: number;
  paidOrders: number;
  pendingReports: number;
  gmvCents: number; // facturación total de órdenes pagadas
  feesCents: number; // comisión total cobrada por la plataforma
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  businessName: string | null;
  createdAt: string;
}

export interface AdminBusinessDto {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  ownerEmail: string;
  productCount: number;
  createdAt: string;
}

export interface AdminProductDto {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  businessName: string;
  priceCents: number;
  createdAt: string;
}

export interface AdminOrderDto {
  id: string;
  buyerEmail: string;
  totalCents: number;
  currency: Currency;
  status: OrderStatus;
  subOrderCount: number;
  createdAt: string;
}

// Detalle completo de una orden para el admin
export interface AdminOrderDetailDto extends OrderDto {
  buyerEmail: string;
  buyerName: string;
}

// Reseña denunciada, para la cola de moderación del admin
export interface AdminReviewDto {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  productTitle: string;
  productSlug: string;
  reportCount: number;
  createdAt: string;
}

// Registro de auditoría de acciones de moderación
export interface AuditLogDto {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
}

// Punto de una serie temporal diaria (métricas del admin)
export interface AdminMetricPoint {
  date: string; // YYYY-MM-DD
  orders: number;
  revenueCents: number;
}

// ── Dashboard del vendedor ───────────────────────────────

// ── Liquidaciones (payouts) ──────────────────────────────

export interface PayoutDto {
  id: string;
  amountCents: number;
  note: string | null;
  createdAt: string;
  salesCount: number; // sub-órdenes que cubrió
}

// Resumen de cobros del vendedor
export interface SellerPayoutSummary {
  availableCents: number; // ventas entregadas sin liquidar (listas para cobrar)
  pendingCents: number; // pagas pero todavía no entregadas
  paidCents: number; // ya liquidado históricamente
  payouts: PayoutDto[]; // historial de liquidaciones recibidas
}

// Fila del panel admin: saldo a pagar por negocio
export interface AdminPayoutRow {
  businessId: string;
  businessName: string;
  businessSlug: string;
  availableCents: number;
  salesCount: number; // ventas entregadas sin liquidar
}

export interface AdminPayoutsView {
  rows: AdminPayoutRow[];
  recent: (PayoutDto & { businessName: string })[];
}

export interface SellerDashboard {
  revenueCents: number; // suma de sub-órdenes de órdenes pagadas (bruto)
  feesCents: number; // comisión de la plataforma sobre esas ventas
  netCents: number; // lo que recibe el vendedor (bruto − comisión)
  salesCount: number;
  pendingSalesCount: number; // ventas esperando confirmación/envío
  activeProducts: number;
  lowStockVariants: number; // variantes con stock <= 3
  recentSales: SellerSubOrderDto[];
}

// ── Mensajería privada (sobre una orden) ─────────────────

export interface MessageDto {
  id: string;
  body: string;
  mine: boolean; // ¿lo envió el usuario actual?
  senderName: string;
  createdAt: string;
}

export interface MessageThread {
  subOrderId: string;
  counterpartyName: string; // con quién estás conversando
  messages: MessageDto[];
}

// ── Notificaciones ───────────────────────────────────────

export const NOTIFICATION_TYPES = [
  'SALE',
  'ORDER_STATUS',
  'QUESTION',
  'QUESTION_ANSWERED',
  'REVIEW_REPLY',
  'PAYOUT',
  'MESSAGE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationDto[];
  unreadCount: number;
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

// Paginación por número de página (para tablas de admin)
export interface Page<T> {
  items: T[];
  total: number;
  page: number; // 1-based
  pageSize: number;
}

// ── Dinero ───────────────────────────────────────────────
// Siempre centavos (int) + moneda explícita.

export type Currency = 'ARS';

export interface Money {
  amountCents: number;
  currency: Currency;
}
