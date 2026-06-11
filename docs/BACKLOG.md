# Backlog — lo que falta para un marketplace real

> Actualizado: 2026-06-11. Lo construido hasta acá: auth completa, negocios,
> catálogo con búsqueda full-text, carrito multi-tienda, checkout con pago
> simulado, gestión de ventas del vendedor, panel completo, UI con marca.
> 33 tests e2e. Este documento lista lo que **falta**, agrupado por área.

## 🔴 Crítico para monetizar (sin esto no hay negocio)

| Item | Notas |
|------|-------|
| **MercadoPago Checkout Pro (sandbox → prod)** | Reemplaza el pago simulado. La arquitectura ya está preparada (el webhook ocupa el lugar de `/orders/:id/pay`). Requiere cuenta developer del usuario. |
| **Modelo de comisión de la plataforma** | Hoy no existe NINGÚN mecanismo de fee. Decidir: % por venta (estándar ~5-13%), suscripción de vendedores, o publicaciones destacadas. Impacta el modelo de datos (campo `feeCents` en SubOrder). |
| **Liquidaciones a vendedores (payouts)** | MVP: registro manual de cuánto se le debe a cada negocio. Futuro: split automático con MP Marketplace. |
| **Recuperación de contraseña** | No existe. Imposible operar sin esto. Requiere emails. |
| **Emails transaccionales (Resend)** | Confirmación de compra, aviso de venta al vendedor, cambios de estado, reset de password. |
| **Deploy a producción** | Vercel (web) + Railway/Render (API) + Neon (DB) + dominio. Incluye CD en GitHub Actions. |
| **Términos y condiciones + privacidad** | Legal mínimo para operar con dinero de terceros. |

## 🟠 Importante para que la compra funcione bien

- **Subida real de imágenes (Cloudinary)** — hoy se pega una URL a mano; fricción enorme para vendedores reales. Incluye múltiples imágenes en la UI (la API ya soporta 8).
- **Selector de variantes en la página de producto** — hoy el botón agrega siempre la variante default; si hay talles/colores no se pueden elegir.
- **Crear/editar múltiples variantes desde el panel** — la API lo soporta; la UI solo maneja una.
- **Selector de cantidad al agregar al carrito** — hoy agrega de a 1.
- **Carrito anónimo** — hoy pide login para agregar; lo estándar es carrito en localStorage que se fusiona al loguear.
- **Direcciones guardadas** — el modelo `Address` existe en la DB pero no tiene endpoints ni UI; en checkout se tipea todo cada vez.
- **Envíos** — hoy "a coordinar". Mínimo: costo fijo por vendedor o retiro en persona; futuro: integración con correo.
- **Cancelación por parte del comprador** — hoy solo el vendedor puede cancelar.
- **Reembolsos/devoluciones** — el estado `REFUNDED` existe pero no hay flujo.

## 🟡 Confianza y seguridad

- **Reseñas y reputación** (fase 2 del diseño) — calificación post-entrega de producto y vendedor.
- **Verificación de email** — el campo `emailVerifiedAt` existe, el flujo no.
- **Google OAuth** — previsto en el diseño, pendiente.
- **Rate limiting** — previsto en el diseño (auth y checkout), no implementado.
- **Reportar publicación** — botón de denuncia + cola de moderación.
- **Rol admin + panel de administración** — moderar negocios/productos/usuarios; hoy no hay concepto de admin.
- **Mensajería comprador-vendedor** (fase 2) — preguntas en la publicación o chat post-compra.

## 🟢 Crecimiento y UX

- **Ordenamiento de resultados** — la API solo ordena por reciente; faltan precio asc/desc y relevancia.
- **SEO técnico** — sitemap.xml, robots.txt, Open Graph/JSON-LD en productos. Clave: el SSR ya está, esto es barato y trae tráfico.
- **Productos relacionados** en el detalle.
- **Favoritos / lista de deseados.**
- **Páginas de categoría** con subcategorías navegables (`/c/[slug]` del diseño).
- **Notificaciones in-app** (campanita) además de emails.
- **Analytics** — saber qué se busca y no se encuentra.
- **Búsqueda: sinónimos/typos** — eventual Meilisearch si el full-text queda corto.

## 🔧 Deuda técnica

- **Tests del frontend: cero.** Mínimo: tests de las server actions y un smoke con Playwright.
- **`getCartCount` en el header** hace un fetch extra en cada página SSR — cachear o mover a client.
- **Errores silenciados** en varias actions (`catch(() => undefined)`) — el usuario no ve por qué falló (ej: stock insuficiente al sumar cantidad).
- **Prisma 6→7** — `package.json#prisma` está deprecado; migrar a `prisma.config.ts`.
- **`<img>` sin optimizar** — migrar a `next/image` con `remotePatterns` cuando las imágenes vengan de Cloudinary.
- **Observabilidad** — logs estructurados, Sentry para errores, health checks con alertas.
- **Backups de la DB** y plan de restore (Neon lo da casi gratis).
- **CSP de helmet** revisar para producción.
- **Accesibilidad** — auditoría básica (labels, contraste, foco).

## Sugerencia de orden (3 tandas)

1. **Tanda "se puede cobrar":** MercadoPago sandbox → comisión de plataforma → emails + reset de password → deploy + legal.
2. **Tanda "se puede vender en serio":** Cloudinary → variantes completas (UI) → direcciones guardadas → envíos básicos → carrito anónimo.
3. **Tanda "puede crecer":** reseñas → SEO técnico → admin/moderación → mensajería → analytics.
