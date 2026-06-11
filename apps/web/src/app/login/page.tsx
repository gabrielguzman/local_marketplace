import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { loginAction } from '@/lib/auth-actions';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Ingresar' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-6 text-xl font-semibold">Ingresá a tu cuenta</h1>
      <AuthForm
        action={loginAction}
        submitLabel="Ingresar"
        fields={[
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'password', label: 'Contraseña', type: 'password' },
        ]}
      />
      <p className="mt-4 text-sm text-zinc-600">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="font-medium underline">
          Creá una
        </Link>
      </p>
    </div>
  );
}
