import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // rutas privadas o sin valor para buscadores
      disallow: ['/admin', '/vender', '/carrito', '/checkout', '/compras'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
