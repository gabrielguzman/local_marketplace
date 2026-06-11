// Cliente de la API. Server-side usa API_URL; NEXT_PUBLIC_API_URL queda
// para futuras llamadas desde el browser.

export const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api/v1';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function parseError(res: Response): Promise<ApiRequestError> {
  const body = (await res.json().catch(() => null)) as {
    code?: string;
    message?: string | string[];
  } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join('. ')
    : (body?.message ?? `Error ${res.status}`);
  return new ApiRequestError(res.status, body?.code ?? 'UNKNOWN', message);
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Igual que apiFetch pero con el access token de la sesión.
// El refresh automático lo maneja proxy.ts antes de llegar acá.
export async function authFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
