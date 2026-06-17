import Link from 'next/link';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="surface-card p-8">
        <h1 className="text-xl font-bold tracking-tight">
          Recuperá tu contraseña
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          Ingresá tu email y te mandamos un enlace para crear una nueva.
        </p>
        <ForgotPasswordForm />
      </div>
      <p className="mt-5 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  );
}
