import Link from 'next/link';
import type { CategoryDto } from '@marketplace/shared';
import { apiFetch } from '@/lib/api';
import { getCartCount } from '@/lib/cart-session';
import { getUnreadCount } from '@/lib/notifications';
import { getCurrentUser } from '@/lib/session';
import { AccountMenu } from './account-menu';
import { Logo } from './logo';
import { SearchBar } from './search-bar';

const ICON_BTN =
  'relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900';

function Badge({ count, tone }: { count: number; tone: 'brand' | 'red' }) {
  if (count <= 0) return null;
  const bg = tone === 'red' ? 'bg-red-500' : 'bg-brand-600';
  return (
    <span
      className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full ${bg} px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export async function Header() {
  const [user, categories, cartCount, notifCount] = await Promise.all([
    getCurrentUser(),
    apiFetch<CategoryDto[]>('/categories').catch(() => [] as CategoryDto[]),
    getCartCount(),
    getUnreadCount(),
  ]);

  const cartLink = (
    <Link href="/carrito" aria-label={`Carrito (${cartCount})`} className={ICON_BTN}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      <Badge count={cartCount} tone="brand" />
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 shadow-[0_1px_2px_0_rgb(24_24_27/0.04)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <Logo />

        <div className="order-last w-full md:order-none md:w-auto md:flex-1">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/vender"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 sm:inline-flex"
          >
            Vender
          </Link>

          {user ? (
            <>
              <div className="flex items-center gap-0.5">
                <Link
                  href="/notificaciones"
                  aria-label={`Notificaciones (${notifCount})`}
                  className={ICON_BTN}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 19a2 2 0 0 0 4 0"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <Badge count={notifCount} tone="red" />
                </Link>

                <Link
                  href="/favoritos"
                  aria-label="Favoritos"
                  className={`${ICON_BTN} hover:text-red-500`}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c1.9 0 3.2 1.1 3.9 2.2.4.6.6.9 1.1.9s.7-.3 1.1-.9c.7-1.1 2-2.2 3.9-2.2 3 0 4.5 3 3 6C19 15.65 12 20 12 20Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                {cartLink}
              </div>

              <div className="mx-1.5 h-6 w-px bg-zinc-200" />

              <AccountMenu name={user.name} isAdmin={user.role === 'ADMIN'} />
            </>
          ) : (
            <>
              {cartLink}
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
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
        <div className="border-t border-zinc-100 bg-white/60">
          <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5 text-sm">
            <span className="mr-1 hidden shrink-0 items-center gap-1.5 pl-1 pr-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:flex">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Categorías
            </span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cat.slug}`}
                className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-brand-50 hover:text-brand-700"
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
