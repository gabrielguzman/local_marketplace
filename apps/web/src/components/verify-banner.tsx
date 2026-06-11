import { getCurrentUser } from '@/lib/session';
import { resendVerificationAction } from '@/lib/trust-actions';

export async function VerifyBanner() {
  const user = await getCurrentUser();
  if (!user || user.emailVerified) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-800">
        <p>
          ✉️ Verificá tu email (<strong>{user.email}</strong>) para poder
          vender en Mercato.
        </p>
        <form action={resendVerificationAction}>
          <button
            type="submit"
            className="font-semibold underline hover:text-amber-950"
          >
            Reenviar email
          </button>
        </form>
      </div>
    </div>
  );
}
