import Link from 'next/link';
import { Logo } from './logo';

const LINK = 'text-zinc-500 transition hover:text-brand-700';

function Column({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className={LINK}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Logo />
            <p className="max-w-xs text-sm leading-6 text-zinc-500">
              El marketplace de los negocios de tu zona. Comprá directo, vendé
              fácil y hacé crecer tu tienda.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-medium text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1">
                🔒 Pago seguro
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1">
                🇦🇷 Hecho en Argentina
              </span>
            </div>
          </div>

          <Column
            title="Comprar"
            links={[
              { href: '/buscar', label: 'Todos los productos' },
              { href: '/tiendas', label: 'Tiendas' },
              { href: '/', label: 'Categorías' },
              { href: '/favoritos', label: 'Mis favoritos' },
              { href: '/compras', label: 'Mis compras' },
            ]}
          />

          <Column
            title="Vender"
            links={[
              { href: '/vender', label: 'Crear mi negocio' },
              { href: '/vender/productos/nuevo', label: 'Publicar un producto' },
              { href: '/vender/ventas', label: 'Mis ventas' },
            ]}
          />

          <Column
            title="Cuenta"
            links={[
              { href: '/login', label: 'Ingresar' },
              { href: '/registro', label: 'Crear cuenta' },
              { href: '/cuenta', label: 'Mi perfil' },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Mercato. Todos los derechos reservados.</p>
          <p className="flex items-center gap-3">
            <Link href="/terminos" className="hover:text-brand-700">
              Términos
            </Link>
            <span className="text-zinc-200">·</span>
            <Link href="/privacidad" className="hover:text-brand-700">
              Privacidad
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
