import Link from 'next/link';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/reset-password-form';

export const metadata: Metadata = { title: 'Restablecer contraseña' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="surface-card p-8">
        <h1 className="text-xl font-bold tracking-tight">Nueva contraseña</h1>
        {token ? (
          <>
            <p className="mb-6 mt-1 text-sm text-zinc-500">
              Elegí una contraseña nueva. Vas a tener que volver a iniciar
              sesión en todos tus dispositivos.
            </p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            El enlace no es válido. Pedí uno nuevo desde{' '}
            <Link
              href="/recuperar"
              className="font-semibold text-brand-600 hover:underline"
            >
              recuperar contraseña
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
