import 'server-only';
import { cookies } from 'next/headers';

export interface Zona {
  province: string;
  city?: string;
}

export const ZONA_COOKIE = 'mk_zona';

// Zona elegida por el usuario (provincia + ciudad opcional), o null.
export async function getZona(): Promise<Zona | null> {
  const raw = (await cookies()).get(ZONA_COOKIE)?.value;
  if (!raw) return null;
  try {
    const z = JSON.parse(raw) as Partial<Zona>;
    if (z && typeof z.province === 'string' && z.province.trim()) {
      return {
        province: z.province,
        city: typeof z.city === 'string' && z.city.trim() ? z.city : undefined,
      };
    }
  } catch {
    // cookie corrupta: se ignora
  }
  return null;
}

// Querystring para pasar la zona a /businesses
export function zonaQuery(zona: Zona | null): string {
  if (!zona) return '';
  const q = new URLSearchParams({ province: zona.province });
  if (zona.city) q.set('city', zona.city);
  return q.toString();
}
