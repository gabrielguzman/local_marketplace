# Backlog por módulo

> Actualizado: 2026-06-13 (56 tests e2e).
> Marcas: 🔴 bloquea monetizar · 🟠 afecta la experiencia de compra/venta · 🟢 mejora/crecimiento

## 1. Autenticación

**Hecho:** registro/login, refresh rotativo single-use, logout, verificación de email,
suspensión de cuentas, rate limiting, roles USER/ADMIN en el JWT, cambio de contraseña
estando logueado (rota las sesiones).

- 🔴 **Recuperación de contraseña** — el tipo `PASSWORD_RESET` ya existe en el schema; falta endpoint + página. Depende de emails reales.
- 🟢 Cambiar email (con re-verificación).
- 🟢 Google OAuth (previsto en el diseño original).
- 🟢 Ver/cerrar sesiones activas ("cerrar sesión en todos los dispositivos").
- 🟢 Rate limit por cuenta además de por IP (hoy un atacante distribuido no se frena).

## 2. Usuarios y perfil

**Hecho:** GET/PATCH /me (nombre, teléfono, avatar por URL), página /cuenta con
edición de perfil, CRUD de direcciones guardadas (con principal automática, editables
inline) y selección de dirección guardada en el checkout, baja de cuenta con
anonimización (Ley 25.326).

- 🟢 Avatar con upload real (depende de Cloudinary).

## 3. Negocios

**Hecho:** crear (1 por usuario, requiere email verificado), editar perfil completo,
página pública con reputación, suspensión por admin.

- 🔴 **KYC del vendedor** — para pagarle de verdad a un vendedor vas a necesitar identidad/CUIT/CBU. Requisito de MercadoPago marketplace y de cualquier liquidación.
- 🟠 Datos de contacto/ubicación/horarios del negocio (campos + UI).
- 🟢 Flujo de aprobación: el estado `PENDING` existe pero no se usa (nacen ACTIVE). Decidir si se quiere moderación previa.
- 🟢 Varios negocios por usuario (el modelo lo permite cambiando un unique).

## 4. Catálogo y productos

**Hecho:** CRUD completo, variantes con alta/edición/baja protegida, hasta 8 imágenes
por URL, pausar/soft-delete, panel con alertas de stock, selector de variante y
cantidad en la página pública.

- 🟠 **Subida real de imágenes (Cloudinary)** — pegar URLs a mano es inviable para un vendedor real. El mayor irritante de UX actual.
- 🟢 Página de categoría `/c/[slug]` con subcategorías navegables (las hijas solo filtran).
- 🟢 ABM de categorías para el admin (hoy solo viven en el seed).

## 5. Búsqueda

**Hecho:** full-text en español con índice GIN, filtros por categoría (incluye hijas),
precio, negocio y calificación, paginación por cursor, ordenamiento por recientes /
precio asc-desc / relevancia (`ts_rank`).

- 🟢 Autocompletado / sugerencias en el buscador.
- 🟢 Tolerancia a typos y sinónimos (la puerta a Meilisearch si el negocio lo pide).
- 🟢 Indexar atributos de variantes (buscar "remera roja" no matchea el atributo color).

## 6. Carrito

**Hecho:** multi-negocio agrupado por tienda, cantidades validadas contra stock,
badge con contador en el header, errores de stock visibles al cambiar cantidades,
carrito anónimo (cookie de invitado + merge al loguear), favoritos (guardar para
después) con página propia y corazón en el detalle.

## 7. Checkout y órdenes

**Hecho:** checkout transaccional con sub-órdenes por negocio y snapshots, pago
simulado con descuento atómico de stock y auto-cancelación, estados del vendedor
con transiciones validadas, vistas comprador/vendedor, cancelación de orden impaga
por el comprador, línea de tiempo del envío en el detalle.

- 🔴 **MercadoPago Checkout Pro + webhook idempotente** — reemplaza el pago simulado; la arquitectura ya le dejó el lugar.
- 🔴 **Comisión de la plataforma** — no existe ningún fee. Decidir modelo (% por venta es lo estándar) y agregar `feeCents` a SubOrder calculado al crear la orden.
- 🟢 Reembolsos (el estado REFUNDED existe sin flujo).
- 🟢 Limpieza/expiración de órdenes PENDING_PAYMENT viejas.

## 8. Pagos y monetización (módulo inexistente)

- 🔴 Integración MercadoPago (ver §7).
- 🔴 **Liquidaciones a vendedores** — registro de cuánto se le debe a cada negocio (GMV − comisión), aunque el pago inicial sea manual por transferencia.
- 🔴 Facturación / ARCA si opera en Argentina.
- 🟢 Conciliación: reporte pagos MP vs órdenes.
- 🟢 Split automático (MP marketplace) — proyecto en sí mismo, fase posterior.

## 9. Envíos (módulo inexistente)

- 🟠 Opciones por vendedor: retiro en persona / envío con costo fijo — lo mínimo para cerrar el círculo.
- 🟢 Costo por zona, integración con correo/mensajería, tracking.

## 10. Reseñas y confianza

**Hecho:** reseñas solo post-entrega (1 por producto/usuario), promedio en producto
y tienda, estrellas en las cards de listado, denuncias tipificadas, verificación
de email para vender, respuesta del vendedor a una reseña, editar/borrar la propia
reseña.

- 🟢 Reportar reseñas ofensivas.
- 🟢 Preguntas y respuestas en la publicación (la "mensajería" de fase 2 — gran feature de conversión en ML).

## 11. Admin y moderación

**Hecho:** stats con GMV, denuncias por estado, usuarios (buscar/suspender/rol),
negocios, productos, órdenes — todo con acciones directas, confirmación en las
acciones destructivas, paginación real (20 por página) en los cuatro listados,
detalle de orden con datos del comprador, log de auditoría de acciones de
moderación, métricas con serie temporal de 14 días en el panel.

- 🟢 Gestión de categorías (ver §4).

## 12. Emails y notificaciones

**Hecho:** EmailService con abstracción lista para swap (hoy loguea a consola) +
email de verificación.

- 🔴 **Proveedor real (Resend)** — sin esto la verificación y el reset de password no llegan a nadie.
- 🟠 Transaccionales del flujo de compra: confirmación al comprador, aviso de venta al vendedor, cambios de estado de envío.
- 🟢 Notificaciones in-app (campanita).
- 🟢 Preferencias de notificación por usuario.

## 13. Frontend general

**Hecho:** loading skeleton, error boundary y 404 globales; robots.txt, sitemap.xml
y Open Graph en productos; feedback de éxito en formularios (FormFeedback) y
confirmación reusable en acciones destructivas (ConfirmForm).

- 🟢 JSON-LD (`schema.org/Product`) en el detalle de producto.
- 🟢 `next/image` con remotePatterns (cuando las imágenes vengan de Cloudinary).
- 🟢 Auditoría de accesibilidad (labels, foco, contraste).
- 🟢 Pulido mobile (el responsive básico está, falta afinarlo).

## 14. Infraestructura y calidad

- 🔴 **Deploy** — Vercel (web) + Railway/Render (API) + Neon (DB) + dominio + CD en Actions.
- 🟠 **Tests del frontend: cero** — mínimo: server actions + un smoke de Playwright del flujo de compra.
- 🟠 Observabilidad: Sentry + logs estructurados (hoy un error en prod sería invisible).
- 🟢 Backups y plan de restore (Neon lo trae).
- 🟢 Migración Prisma 6→7 (`package.json#prisma` → `prisma.config.ts`).
- 🟢 Cachear el contador del carrito del header (hoy 1 fetch extra por página SSR).
- 🟢 Revisar CSP de helmet para producción.

## 15. Legal (módulo inexistente)

- 🔴 Términos y condiciones + política de privacidad — mínimo para operar con dinero de terceros.
- 🟢 Política de devoluciones, baja de datos (Ley 25.326).

---

### Lectura rápida: los 🔴 son 8

MercadoPago, comisión de plataforma, liquidaciones, KYC vendedores, reset de
password, emails reales, deploy y legal. Eso es "la tanda de monetización" —
todo lo demás es experiencia y crecimiento.
