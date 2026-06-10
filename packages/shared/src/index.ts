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
