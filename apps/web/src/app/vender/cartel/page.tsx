import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import QRCode from 'qrcode';
import type { BusinessDto } from '@marketplace/shared';
import { PrintButton } from '@/components/print-button';
import { authFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/session';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = { title: 'Cartel para la vidriera' };
export const dynamic = 'force-dynamic';

export default async function CartelPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );
  if (!business) redirect('/vender');

  const url = `${SITE_URL}/tienda/${business.slug}`;
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return (
    <div className="mx-auto max-w-xl space-y-5 py-6">
      <nav className="text-xs text-zinc-400 print:hidden">
        <Link href="/vender" className="hover:text-brand-600">
          Panel de vendedor
        </Link>{' '}
        › Cartel para la vidriera
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cartel para la vidriera
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Imprimilo y pegalo en tu local: tus clientes escanean y entran a tu
            tienda online.
          </p>
        </div>
        <PrintButton label="🖨️ Imprimir cartel" />
      </div>

      {/* El cartel imprimible */}
      <div className="surface-card mx-auto max-w-sm overflow-hidden text-center">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-5 text-white">
          <p className="text-sm font-medium text-brand-100">Encontranos en</p>
          <p className="text-2xl font-extrabold tracking-tight">Mercato</p>
        </div>
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            {business.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Escaneá y comprá online 📲
          </p>
          <div
            className="mx-auto mt-4 h-56 w-56 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-4 break-all text-xs text-zinc-400">
            {url.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>
    </div>
  );
}
