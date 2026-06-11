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
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-6 text-xl font-semibold">Creá tu cuenta</h1>
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
      <p className="mt-4 text-sm text-zinc-600">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
