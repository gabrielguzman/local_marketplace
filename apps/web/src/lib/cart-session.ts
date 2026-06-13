import 'server-only';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { CartDto } from '@marketplace/shared';
import { apiFetch } from './api';
import { cookieBase } from './session-cookies';
import { getAccessToken } from './session';

// Carrito de invitado: identidad anónima en cookie httpOnly. Al loguearse
// se mergea contra el carrito del usuario (ver auth-actions).
export const GUEST_CART_COOKIE = 'mk_guest_cart';
const GUEST_MAX_AGE = 30 * 24 * 60 * 60;

const EMPTY_CART: CartDto = { items: [], totalCents: 0, currency: 'ARS' };

// Headers de identidad para LEER el carrito. No crea nada.
// null = sin identidad todavía (carrito vacío).
async function readHeaders(): Promise<Record<string, string> | null> {
  const token = await getAccessToken();
  if (token) return { Authorization: `Bearer ${token}` };
  const guest = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  return guest ? { 'X-Guest-Cart': guest } : null;
}

// Headers para ESCRIBIR en el carrito. Crea la cookie de invitado si falta.
// Solo se puede llamar desde un server action (puede escribir cookies).
export async function ensureCartHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) return { Authorization: `Bearer ${token}` };

  const store = await cookies();
  let guest = store.get(GUEST_CART_COOKIE)?.value;
  if (!guest) {
    guest = randomUUID();
    store.set(GUEST_CART_COOKIE, guest, {
      ...cookieBase,
      maxAge: GUEST_MAX_AGE,
    });
  }
  return { 'X-Guest-Cart': guest };
}

export async function getGuestToken(): Promise<string | null> {
  return (await cookies()).get(GUEST_CART_COOKIE)?.value ?? null;
}

export async function clearGuestCart(): Promise<void> {
  (await cookies()).delete(GUEST_CART_COOKIE);
}

// Carrito de la identidad actual (usuario o invitado), para SSR.
export async function getCart(): Promise<CartDto> {
  const headers = await readHeaders();
  if (!headers) return EMPTY_CART;
  return apiFetch<CartDto>('/cart', { headers }).catch(() => EMPTY_CART);
}

export async function getCartCount(): Promise<number> {
  const cart = await getCart();
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}
