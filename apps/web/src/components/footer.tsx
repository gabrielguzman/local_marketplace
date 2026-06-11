import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm leading-6 text-zinc-500">
            El marketplace de los negocios de tu zona. Comprá directo, vendé
            fácil.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Comprar</h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li>
              <Link href="/buscar" className="hover:text-brand-700">
                Todos los productos
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-brand-700">
                Categorías
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Vender</h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li>
              <Link href="/vender" className="hover:text-brand-700">
                Crear mi negocio
              </Link>
            </li>
            <li>
              <Link href="/vender/productos/nuevo" className="hover:text-brand-700">
                Publicar un producto
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Cuenta</h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li>
              <Link href="/login" className="hover:text-brand-700">
                Ingresar
              </Link>
            </li>
            <li>
              <Link href="/registro" className="hover:text-brand-700">
                Crear cuenta
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Mercato · Hecho en Argentina
      </div>
    </footer>
  );
}
