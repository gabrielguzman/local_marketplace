import Link from 'next/link';
import type { Metadata } from 'next';
import type { CartItemDto } from '@marketplace/shared';
import { CartQuantity } from '@/components/cart-quantity';
import { removeCartItemAction } from '@/lib/cart-actions';
import { getCart } from '@/lib/cart-session';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Carrito' };
export const dynamic = 'force-dynamic';

function groupByBusiness(items: CartItemDto[]) {
  const groups = new Map<string, { name: string; slug: string; items: CartItemDto[] }>();
  for (const item of items) {
    const group = groups.get(item.business.id) ?? {
      name: item.business.name,
      slug: item.business.slug,
      items: [],
    };
    group.items.push(item);
    groups.set(item.business.id, group);
  }
  return [...groups.values()];
}

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          Tu carrito está vacío
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cuando agregues productos van a aparecer acá.
        </p>
        <Link href="/buscar" className="btn-primary mt-6">
          Explorar productos
        </Link>
      </div>
    );
  }

  const groups = groupByBusiness(cart.items);
  const hasStockIssue = cart.items.some(
    (i) => i.variant.stock === 0 || i.quantity > i.variant.stock,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tu carrito</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.slug} className="surface-card overflow-hidden">
              <Link
                href={`/tienda/${group.slug}`}
                className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700 hover:text-brand-600"
              >
                🏪 {group.name}
              </Link>
              <ul className="divide-y divide-zinc-50">
                {group.items.map((item) => (
                  <li key={item.id} className="flex gap-4 px-5 py-4">
                    <Link
                      href={`/p/${item.product.slug}`}
                      className="block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100"
                    >
                      {item.product.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
                        <img
                          src={item.product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/p/${item.product.slug}`}
                        className="line-clamp-2 text-sm font-medium text-zinc-800 hover:text-brand-600"
                      >
                        {item.product.title}
                      </Link>
                      {Object.values(item.variant.attributes).length > 0 && (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {Object.values(item.variant.attributes).join(' · ')}
                        </p>
                      )}

                      <div className="mt-2 flex items-start gap-3">
                        <CartQuantity
                          itemId={item.id}
                          quantity={item.quantity}
                          stock={item.variant.stock}
                        />
                        <form action={removeCartItemAction} className="py-1">
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className="text-xs text-zinc-400 hover:text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>

                      {item.variant.stock === 0 ? (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          Sin stock — quitalo para continuar.
                        </p>
                      ) : item.quantity > item.variant.stock ? (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          Solo quedan {item.variant.stock}. Ajustá la cantidad.
                        </p>
                      ) : (
                        item.variant.stock <= 5 && (
                          <p className="mt-2 text-xs font-medium text-amber-600">
                            ¡Últimas {item.variant.stock} unidades!
                          </p>
                        )
                      )}
                    </div>

                    <p className="shrink-0 text-sm font-bold">
                      {formatPrice(
                        item.variant.priceCents * item.quantity,
                        item.variant.currency,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside>
          <div className="surface-card sticky top-32 p-6">
            <h2 className="text-base font-bold tracking-tight">Resumen</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-500">
                <dt>
                  Productos (
                  {cart.items.reduce((sum, i) => sum + i.quantity, 0)})
                </dt>
                <dd>{formatPrice(cart.totalCents, cart.currency)}</dd>
              </div>
              <div className="flex justify-between text-zinc-500">
                <dt>Envío</dt>
                <dd className="text-green-600">A coordinar</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-bold text-zinc-900">
                <dt>Total</dt>
                <dd>{formatPrice(cart.totalCents, cart.currency)}</dd>
              </div>
            </dl>
            {hasStockIssue ? (
              <>
                <p className="mt-5 text-xs text-red-600">
                  Hay productos sin stock o con cantidad mayor a la disponible.
                  Ajustalos para continuar.
                </p>
                <button
                  type="button"
                  disabled
                  className="btn-primary mt-2 w-full cursor-not-allowed opacity-50"
                >
                  Continuar compra
                </button>
              </>
            ) : (
              <Link href="/checkout" className="btn-primary mt-5 w-full">
                Continuar compra
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
