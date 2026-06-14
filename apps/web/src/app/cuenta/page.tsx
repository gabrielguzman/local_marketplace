import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type {
  AddressDto,
  MyQuestionDto,
  MyReviewDto,
} from '@marketplace/shared';
import { AddressForm } from '@/components/address-form';
import { AddressRow } from '@/components/address-row';
import { ChangePasswordForm } from '@/components/change-password-form';
import { DeleteAccountForm } from '@/components/delete-account-form';
import { ProfileForm } from '@/components/profile-form';
import { authFetch } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Mi cuenta' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [addresses, myReviews, myQuestions] = await Promise.all([
    authFetch<AddressDto[]>(token, '/me/addresses').catch(
      () => [] as AddressDto[],
    ),
    authFetch<MyReviewDto[]>(token, '/me/reviews').catch(
      () => [] as MyReviewDto[],
    ),
    authFetch<MyQuestionDto[]>(token, '/me/questions').catch(
      () => [] as MyQuestionDto[],
    ),
  ]);

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
              <AddressRow key={address.id} address={address} />
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

      {(myReviews.length > 0 || myQuestions.length > 0) && (
        <section className="surface-card p-7">
          <h2 className="mb-5 text-base font-bold tracking-tight">
            Mi actividad
          </h2>

          {myReviews.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                Mis reseñas ({myReviews.length})
              </h3>
              <ul className="space-y-3">
                {myReviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-zinc-200 p-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-amber-500" aria-hidden="true">
                        {'★'.repeat(r.rating)}
                        <span className="text-zinc-200">
                          {'★'.repeat(5 - r.rating)}
                        </span>
                      </span>
                      <Link
                        href={`/p/${r.productSlug}`}
                        className="truncate text-sm font-medium text-zinc-800 hover:text-brand-600"
                      >
                        {r.productTitle}
                      </Link>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-sm text-zinc-600">“{r.comment}”</p>
                    )}
                    {r.sellerResponse && (
                      <p className="mt-1.5 rounded-lg bg-brand-50/50 px-2.5 py-1.5 text-xs text-zinc-600">
                        <span className="font-semibold text-brand-700">
                          Respuesta:{' '}
                        </span>
                        {r.sellerResponse}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {myQuestions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                Mis preguntas ({myQuestions.length})
              </h3>
              <ul className="space-y-3">
                {myQuestions.map((q) => (
                  <li
                    key={q.id}
                    className="rounded-xl border border-zinc-200 p-3.5"
                  >
                    <Link
                      href={`/p/${q.productSlug}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      {q.productTitle}
                    </Link>
                    <p className="mt-0.5 text-sm font-medium text-zinc-800">
                      {q.body}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {q.answer ? `Respuesta: ${q.answer}` : 'Sin responder aún'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="surface-card p-7">
        <h2 className="mb-5 text-base font-bold tracking-tight">
          Cambiar contraseña
        </h2>
        <ChangePasswordForm />
      </section>

      <section className="surface-card border-red-100 p-7">
        <h2 className="text-base font-bold tracking-tight text-red-700">
          Eliminar cuenta
        </h2>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Esta acción es permanente. Se borran tus datos personales y tu cuenta
          deja de funcionar.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
