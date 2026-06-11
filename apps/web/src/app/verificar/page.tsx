import Link from 'next/link';
import type { Metadata } from 'next';
import { API_URL } from '@/lib/api';

export const metadata: Metadata = { title: 'Verificar email' };
export const dynamic = 'force-dynamic';

async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => null);
  return res?.ok ?? false;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; enviado?: string }>;
}) {
  const { token, enviado } = await searchParams;

  let content: { icon: string; title: string; text: string };
  if (token) {
    const ok = await verifyToken(token);
    content = ok
      ? {
          icon: '✅',
          title: '¡Email verificado!',
          text: 'Tu cuenta quedó confirmada. Ya podés crear tu negocio y vender.',
        }
      : {
          icon: '⚠️',
          title: 'El enlace no es válido',
          text: 'El enlace venció o ya fue usado. Pedí uno nuevo desde el aviso amarillo en la parte superior.',
        };
  } else if (enviado) {
    content = {
      icon: '📬',
      title: 'Te enviamos un email',
      text: 'Revisá tu casilla y hacé click en el enlace de verificación. Vence en 48 horas.',
    };
  } else {
    content = {
      icon: '✉️',
      title: 'Verificación de email',
      text: 'Abrí el enlace que te enviamos por email para confirmar tu cuenta.',
    };
  }

  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-5xl">{content.icon}</p>
      <h1 className="mt-4 text-xl font-bold tracking-tight">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{content.text}</p>
      <Link href="/" className="btn-primary mt-6">
        Ir al inicio
      </Link>
    </div>
  );
}
