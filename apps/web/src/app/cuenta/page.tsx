import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AddressDto } from '@marketplace/shared';
import { AddressForm } from '@/components/address-form';
import { ProfileForm } from '@/components/profile-form';
import { authFetch } from '@/lib/api';
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from '@/lib/account-actions';
import { getAccessToken, getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Mi cuenta' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const addresses = await authFetch<AddressDto[]>(token, '/me/addresses').catch(
    () => [] as AddressDto[],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-2">
      <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>

      <section className="surface-card p-7">
        <h2 className="mb-5 text-base font-bold tracking-tight">
          Datos personales
        </h2>
        <ProfileForm user={user} />
      </section>

      <section className="surface-card p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">Mis direcciones</h2>
          <span className="text-xs text-zinc-400">
            {addresses.length}{' '}
            {addresses.length === 1 ? 'dirección' : 'direcciones'}
          </span>
        </div>

        {addresses.length > 0 && (
          <ul className="mb-6 space-y-3">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800">
                    {address.street} {address.number}
                    {address.isDefault && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                        Principal
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {address.city}, {address.province} (CP {address.zipCode})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  {!address.isDefault && (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <button
                        type="submit"
                        className="font-medium text-brand-600 hover:underline"
                      >
                        Hacer principal
                      </button>
                    </form>
                  )}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button
                      type="submit"
                      className="text-zinc-400 hover:text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-dashed border-zinc-200 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">
            Agregar una dirección
          </h3>
          <AddressForm />
        </div>
      </section>
    </div>
  );
}
