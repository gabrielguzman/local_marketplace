import type { Currency } from '@marketplace/shared';

export function formatPrice(cents: number, currency: Currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
