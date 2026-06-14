import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { createHash, randomBytes } from 'node:crypto';
import type {
  AdminOrderDetailDto,
  AdminStats,
  AuthResponse,
  BusinessDto,
  OrderDto,
  ProductDetailDto,
  ReportDto,
  ReviewDto,
  SellerSubOrderDto,
  UserDto,
} from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ADDRESS = {
  street: 'Calle Falsa',
  number: '123',
  city: 'Springfield',
  province: 'Buenos Aires',
  zipCode: '1900',
};

describe('Trust: verificación, reseñas, denuncias y admin (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const stamp = Date.now();
  const buyerEmail = `e2e-trust-buyer-${stamp}@test.com`;
  const sellerEmail = `e2e-trust-seller-${stamp}@test.com`;
  const adminEmail = `e2e-trust-admin-${stamp}@test.com`;
  const allEmails = [buyerEmail, sellerEmail, adminEmail];

  let buyerToken: string;
  let sellerToken: string;
  let adminToken: string;
  let categoryId: string;
  let productId: string;
  let businessId: string;
  let reviewId: string;
  let orderId: string;

  async function register(email: string, verified = true): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'super-secreta-123', name: 'Trust E2E' })
      .expect(201);
    if (verified) {
      await prisma.user.update({
        where: { email },
        data: { emailVerifiedAt: new Date() },
      });
    }
    return (res.body as AuthResponse).accessToken;
  }

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'super-secreta-123' })
      .expect(200);
    return (res.body as AuthResponse).accessToken;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const category = await prisma.category.create({
      data: { name: 'Cat Trust E2E', slug: `e2e-trust-${stamp}` },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany({
      where: { author: { email: { in: allEmails } } },
    });
    await prisma.report.deleteMany({
      where: { reporter: { email: { in: allEmails } } },
    });
    await prisma.orderItem.deleteMany({
      where: { subOrder: { order: { buyer: { email: { in: allEmails } } } } },
    });
    await prisma.payment.deleteMany({
      where: { order: { buyer: { email: { in: allEmails } } } },
    });
    await prisma.subOrder.deleteMany({
      where: { order: { buyer: { email: { in: allEmails } } } },
    });
    await prisma.order.deleteMany({
      where: { buyer: { email: { in: allEmails } } },
    });
    await prisma.product.deleteMany({
      where: { business: { owner: { email: { in: allEmails } } } },
    });
    await prisma.business.deleteMany({
      where: { owner: { email: { in: allEmails } } },
    });
    await prisma.auditLog.deleteMany({
      where: { actor: { email: { in: allEmails } } },
    });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { email: { in: allEmails } } });
    await app.close();
  });

  // ── Verificación de email ────────────────────────────────

  it('un usuario sin verificar no puede crear negocio', async () => {
    const token = await register(sellerEmail, false);
    sellerToken = token;
    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Tienda Trust' })
      .expect(403);
  });

  it('el endpoint verify-email valida el token y habilita vender', async () => {
    // token conocido: insertamos su hash como lo haría la API
    const rawToken = randomBytes(32).toString('base64url');
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: sellerEmail },
    });
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFY',
        tokenHash: createHash('sha256').update(rawToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: rawToken })
      .expect(200);

    // token inválido → 400
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'token-falso' })
      .expect(400);

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    expect((me.body as UserDto).emailVerified).toBe(true);

    const biz = await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: `Tienda Trust ${stamp}` })
      .expect(201);
    businessId = (biz.body as BusinessDto).id;
  });

  // ── Reseñas ──────────────────────────────────────────────

  it('solo se puede reseñar tras recibir el producto', async () => {
    const prod = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: `Pava eléctrica ${stamp}`,
        categoryId,
        variants: [{ priceCents: 2500000, stock: 10 }],
      })
      .expect(201);
    const product = prod.body as ProductDetailDto;
    productId = product.id;

    buyerToken = await register(buyerEmail);

    // sin compra → 403
    await request(app.getHttpServer())
      .post(`/products/${productId}/reviews`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 5 })
      .expect(403);

    // compra completa: carrito → checkout → pago → entrega
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ variantId: product.variants[0].id, quantity: 1 })
      .expect(201);
    const checkout = await request(app.getHttpServer())
      .post('/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(ADDRESS)
      .expect(201);
    orderId = (checkout.body as OrderDto).id;
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const sales = await request(app.getHttpServer())
      .get('/businesses/me/suborders')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    const subOrderId = (sales.body as SellerSubOrderDto[])[0].id;
    for (const status of ['CONFIRMED', 'SHIPPED', 'DELIVERED'] as const) {
      await request(app.getHttpServer())
        .patch(`/suborders/${subOrderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status })
        .expect(200);
    }

    // entregado → ahora sí
    const review = await request(app.getHttpServer())
      .post(`/products/${productId}/reviews`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 4, comment: 'Muy buena, calienta rápido' })
      .expect(201);
    expect((review.body as ReviewDto).rating).toBe(4);
    reviewId = (review.body as ReviewDto).id;

    // duplicada → 409
    await request(app.getHttpServer())
      .post(`/products/${productId}/reviews`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 1 })
      .expect(409);
  });

  it('el promedio aparece en el producto y en la tienda', async () => {
    const prod = await request(app.getHttpServer())
      .get(`/products/pava-electrica-${stamp}`)
      .expect(200);
    const detail = prod.body as ProductDetailDto;
    expect(detail.rating).toEqual({ avg: 4, count: 1 });

    const reviews = await request(app.getHttpServer())
      .get(`/products/${productId}/reviews`)
      .expect(200);
    expect((reviews.body as ReviewDto[])[0].comment).toContain('calienta');

    const biz = await request(app.getHttpServer())
      .get(`/businesses/tienda-trust-${stamp}`)
      .expect(200);
    expect((biz.body as BusinessDto).rating.count).toBe(1);
  });

  it('el vendedor responde la reseña; un tercero no puede', async () => {
    // el comprador (no dueño del negocio) no puede responder
    await request(app.getHttpServer())
      .post(`/products/${productId}/reviews/${reviewId}/reply`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ response: 'Gracias!' })
      .expect(403);

    const res = await request(app.getHttpServer())
      .post(`/products/${productId}/reviews/${reviewId}/reply`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ response: '¡Gracias por tu compra!' })
      .expect(201);
    expect((res.body as ReviewDto).sellerResponse).toBe(
      '¡Gracias por tu compra!',
    );
  });

  it('el autor edita su reseña; un tercero no puede', async () => {
    // el vendedor no puede editar la reseña ajena
    await request(app.getHttpServer())
      .patch(`/products/${productId}/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ rating: 1 })
      .expect(403);

    const res = await request(app.getHttpServer())
      .patch(`/products/${productId}/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 5, comment: 'La sigo usando, excelente' })
      .expect(200);
    expect((res.body as ReviewDto).rating).toBe(5);
    // la respuesta del vendedor sobrevive a la edición
    expect((res.body as ReviewDto).sellerResponse).toBeTruthy();
  });

  it('preguntas y respuestas: cualquiera pregunta, sólo el vendedor responde', async () => {
    const asked = await request(app.getHttpServer())
      .post(`/products/${productId}/questions`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ body: '¿Tiene garantía oficial?' })
      .expect(201);
    const questionId = (asked.body as { id: string }).id;

    // el comprador (no vendedor) no puede responder
    await request(app.getHttpServer())
      .post(`/products/${productId}/questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ answer: 'Sí' })
      .expect(403);

    const answered = await request(app.getHttpServer())
      .post(`/products/${productId}/questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ answer: 'Sí, 12 meses de garantía oficial' })
      .expect(201);
    expect((answered.body as { answer: string }).answer).toContain('12 meses');

    const list = await request(app.getHttpServer())
      .get(`/products/${productId}/questions`)
      .expect(200);
    expect(list.body as unknown[]).toHaveLength(1);
  });

  it('se generan notificaciones in-app para vendedor y comprador', async () => {
    // el vendedor recibió venta + pregunta
    const seller = await request(app.getHttpServer())
      .get('/me/notifications')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    const sellerTypes = (
      seller.body as { items: { type: string }[]; unreadCount: number }
    ).items.map((n) => n.type);
    expect(sellerTypes).toContain('SALE');
    expect(sellerTypes).toContain('QUESTION');
    expect(
      (seller.body as { unreadCount: number }).unreadCount,
    ).toBeGreaterThan(0);

    // el comprador recibió estados de envío + respuesta a su pregunta
    const buyer = await request(app.getHttpServer())
      .get('/me/notifications')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    const buyerTypes = (buyer.body as { items: { type: string }[] }).items.map(
      (n) => n.type,
    );
    expect(buyerTypes).toContain('ORDER_STATUS');
    expect(buyerTypes).toContain('QUESTION_ANSWERED');

    // marcar leídas baja el contador a 0
    await request(app.getHttpServer())
      .post('/me/notifications/read')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(204);
    const after = await request(app.getHttpServer())
      .get('/me/notifications/unread-count')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    expect((after.body as { count: number }).count).toBe(0);
  });

  it('reportar una reseña: el autor no puede denunciar la propia', async () => {
    // el vendedor denuncia la reseña del comprador
    await request(app.getHttpServer())
      .post(`/products/${productId}/reviews/${reviewId}/report`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);
    // idempotente
    await request(app.getHttpServer())
      .post(`/products/${productId}/reviews/${reviewId}/report`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);
    // el autor no puede denunciar su propia reseña
    await request(app.getHttpServer())
      .post(`/products/${productId}/reviews/${reviewId}/report`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(409);

    const count = await prisma.reviewReport.count({ where: { reviewId } });
    expect(count).toBe(1);
  });

  it('el autor borra su reseña y el producto queda sin reseñas', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(204);

    const prod = await request(app.getHttpServer())
      .get(`/products/pava-electrica-${stamp}`)
      .expect(200);
    expect((prod.body as ProductDetailDto).rating).toEqual({
      avg: null,
      count: 0,
    });
  });

  // ── Denuncias y admin ────────────────────────────────────

  it('cualquier usuario logueado puede denunciar una publicación (una vez)', async () => {
    await request(app.getHttpServer())
      .post(`/products/${productId}/report`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'SPAM', details: 'Parece publicidad engañosa' })
      .expect(202);

    await request(app.getHttpServer())
      .post(`/products/${productId}/report`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'OTHER' })
      .expect(409);
  });

  it('los endpoints de admin rechazan a usuarios comunes', async () => {
    await request(app.getHttpServer())
      .get('/admin/reports')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });

  it('el admin ve stats y denuncias, y modera', async () => {
    await register(adminEmail);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
    adminToken = await login(adminEmail); // re-login para que el JWT lleve el rol

    const stats = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((stats.body as AdminStats).pendingReports).toBeGreaterThanOrEqual(1);

    const reports = await request(app.getHttpServer())
      .get('/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING' })
      .expect(200);
    const report = (reports.body as ReportDto[]).find(
      (r) => r.product.id === productId,
    );
    expect(report).toBeDefined();

    // pausa el producto denunciado y resuelve la denuncia
    await request(app.getHttpServer())
      .patch(`/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PAUSED' })
      .expect(204);

    await request(app.getHttpServer())
      .get(`/products/pava-electrica-${stamp}`)
      .expect(404);

    const resolved = await request(app.getHttpServer())
      .patch(`/admin/reports/${report!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' })
      .expect(200);
    expect((resolved.body as ReportDto).status).toBe('RESOLVED');
  });

  it('el admin ve el detalle de una orden con datos del comprador', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const order = res.body as AdminOrderDetailDto;
    expect(order.buyerEmail).toBe(buyerEmail);
    expect(order.subOrders.length).toBeGreaterThanOrEqual(1);
    expect(order.shippingAddress.city).toBe('Springfield');
  });

  it('el admin puede suspender un negocio y desaparece del público', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/businesses/${businessId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' })
      .expect(204);

    await request(app.getHttpServer())
      .get(`/businesses/tienda-trust-${stamp}`)
      .expect(404);
  });
});
