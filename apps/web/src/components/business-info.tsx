import type { BusinessDto } from '@marketplace/shared';

function waLink(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
}
function siteLink(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
function igLink(handle: string): string {
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

export function BusinessInfo({ business }: { business: BusinessDto }) {
  const hasLocation = business.address || business.city || business.province;
  const hasContact =
    business.phone ||
    business.email ||
    business.whatsapp ||
    business.website ||
    business.instagram;

  if (!hasLocation && !hasContact && !business.hours && !business.policies) {
    return null;
  }

  const locationLine = [
    business.address,
    [business.city, business.province].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4">
      {(hasLocation || hasContact || business.hours) && (
        <div className="surface-card space-y-3 p-5 text-sm">
          <h2 className="text-base font-bold tracking-tight">Información</h2>

          {hasLocation && (
            <p className="flex gap-2 text-zinc-600">
              <span aria-hidden="true">📍</span>
              <span>{locationLine}</span>
            </p>
          )}
          {business.hours && (
            <p className="flex gap-2 text-zinc-600">
              <span aria-hidden="true">🕐</span>
              <span>{business.hours}</span>
            </p>
          )}
          {business.phone && (
            <p className="flex gap-2 text-zinc-600">
              <span aria-hidden="true">📞</span>
              <a href={`tel:${business.phone}`} className="hover:text-brand-600">
                {business.phone}
              </a>
            </p>
          )}
          {business.email && (
            <p className="flex gap-2 text-zinc-600">
              <span aria-hidden="true">✉️</span>
              <a
                href={`mailto:${business.email}`}
                className="break-all hover:text-brand-600"
              >
                {business.email}
              </a>
            </p>
          )}

          {(business.whatsapp || business.website || business.instagram) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {business.whatsapp && (
                <a
                  href={waLink(business.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-green-300 hover:text-green-700"
                >
                  WhatsApp
                </a>
              )}
              {business.website && (
                <a
                  href={siteLink(business.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Sitio web
                </a>
              )}
              {business.instagram && (
                <a
                  href={igLink(business.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-pink-300 hover:text-pink-600"
                >
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {business.policies && (
        <div className="surface-card space-y-2 p-5">
          <h2 className="text-base font-bold tracking-tight">
            Políticas de la tienda
          </h2>
          <p className="whitespace-pre-line text-sm leading-6 text-zinc-600">
            {business.policies}
          </p>
        </div>
      )}
    </div>
  );
}
