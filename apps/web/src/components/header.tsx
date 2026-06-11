import Link from 'next/link';
import { logoutAction } from '@/lib/auth-actions';
import { getCurrentUser } from '@/lib/session';
import { SearchBar } from './search-bar';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-amber-300">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Marketplace
        </Link>

        <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/vender" className="font-medium hover:underline">
            Vender
          </Link>
          {user ? (
            <>
              <span className="hidden text-zinc-700 sm:inline">
                Hola, {user.name.split(' ')[0]}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="hover:underline">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
