import Link from 'next/link';
import type { CategoryDto } from '@marketplace/shared';
import { apiFetch } from '@/lib/api';
import { logoutAction } from '@/lib/auth-actions';
import { getCurrentUser } from '@/lib/session';
import { Logo } from './logo';
import { SearchBar } from './search-bar';

export async function Header() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    apiFetch<CategoryDto[]>('/categories').catch(() => [] as CategoryDto[]),
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
              <span className="hidden rounded-lg px-3 py-2 text-zinc-500 lg:inline">
                Hola, {user.name.split(' ')[0]}
              </span>
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
