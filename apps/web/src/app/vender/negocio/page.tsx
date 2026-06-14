import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessDto } from '@marketplace/shared';
import { BusinessEditForm } from '@/components/business-edit-form';
import { authFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Mi negocio' };
export const dynamic = 'force-dynamic';

export default async function EditBusinessPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );
  if (!business) redirect('/vender');

  return (
    <div className="mx-auto max-w-4xl py-8">
      <nav className="mb-4 text-xs text-zinc-400">
        <Link href="/vender" className="hover:text-brand-600">
          Panel de vendedor
        </Link>{' '}
        › Mi negocio
      </nav>
      <div className="surface-card p-8">
        <h1 className="text-xl font-bold tracking-tight">
          Perfil de la tienda
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          Así te van a ver los compradores en{' '}
          <Link
            href={`/tienda/${business.slug}`}
            className="text-brand-600 hover:underline"
          >
            /tienda/{business.slug}
          </Link>
        </p>
        <BusinessEditForm business={business} />
      </div>
    </div>
  );
}
