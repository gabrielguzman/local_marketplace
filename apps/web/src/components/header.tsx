import Link from 'next/link';
import type { CartDto, CategoryDto } from '@marketplace/shared';
import { apiFetch, authFetch } from '@/lib/api';
import { logoutAction } from '@/lib/auth-actions';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { Logo } from './logo';
import { SearchBar } from './search-bar';

async function getCartCount(): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;
  try {
    const cart = await authFetch<CartDto>(token, '/cart');
    return cart.items.reduce((sum, i) => sum + i.quantity, 0);
  } catch {
    return 0;
  }
}

export async function Header() {
  const [user, categories, cartCount] = await Promise.all([
    getCurrentUser(),
    apiFetch<CategoryDto[]>('/categories').catch(() => [] as CategoryDto[]),
    getCartCount(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Logo />

        <div className="order-last w-full md:order-none md:w-auto md:flex-1">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/vender"
            className="rounded-lg px-3 py-2 font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            Vender
          </Link>
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 font-medium text-red-600 transition hover:bg-red-50"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/compras"
                className="rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Mis compras
              </Link>
              <Link
                href="/carrito"
                aria-label={`Carrito (${cartCount})`}
                className="relative rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4h2l2.4 12.2A2 2 0 0 0 9.36 18H18a2 2 0 0 0 1.96-1.6L21.5 9H6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="21" r="1.2" fill="currentColor" />
                  <circle cx="17.5" cy="21" r="1.2" fill="currentColor" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Ingresar
              </Link>
              <Link href="/registro" className="btn-primary ml-1 !px-4 !py-2">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="border-t border-zinc-100 bg-white">
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1.5 text-sm">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/buscar?category=${cat.slug}`}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-zinc-500 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
