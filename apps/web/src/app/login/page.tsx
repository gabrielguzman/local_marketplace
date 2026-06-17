import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { loginAction } from '@/lib/auth-actions';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Ingresar' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  if (await getCurrentUser()) redirect('/');
  const { reset } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="surface-card p-8">
        <h1 className="text-xl font-bold tracking-tight">
          Ingresá a tu cuenta
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          Qué bueno verte de nuevo 👋
        </p>
        {reset && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            Tu contraseña se cambió. Ingresá con la nueva.
          </div>
        )}
        <AuthForm
          action={loginAction}
          submitLabel="Ingresar"
          fields={[
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'password', label: 'Contraseña', type: 'password' },
          ]}
        />
        <p className="mt-4 text-center text-sm">
          <Link
            href="/recuperar"
            className="text-zinc-500 hover:text-brand-600 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
      <p className="mt-5 text-center text-sm text-zinc-500">
        ¿No tenés cuenta?{' '}
        <Link
          href="/registro"
          className="font-semibold text-brand-600 hover:underline"
        >
          Creá una gratis
        </Link>
      </p>
    </div>
  );
}
