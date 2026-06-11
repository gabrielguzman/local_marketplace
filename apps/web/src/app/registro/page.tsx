import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { registerAction } from '@/lib/auth-actions';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Crear cuenta' };
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="surface-card p-8">
        <h1 className="text-xl font-bold tracking-tight">Creá tu cuenta</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          Gratis, en menos de un minuto.
        </p>
        <AuthForm
          action={registerAction}
          submitLabel="Crear cuenta"
          fields={[
            { name: 'name', label: 'Nombre', type: 'text', minLength: 2 },
            { name: 'email', label: 'Email', type: 'email' },
            {
              name: 'password',
              label: 'Contraseña',
              type: 'password',
              minLength: 8,
              placeholder: 'Mínimo 8 caracteres',
            },
          ]}
        />
      </div>
      <p className="mt-5 text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:underline"
        >
          Ingresá
        </Link>
      </p>
    </div>
  );
}
