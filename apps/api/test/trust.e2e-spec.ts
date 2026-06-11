import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { createHash, randomBytes } from 'node:crypto';
import type {
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
    const orderId = (checkout.body as OrderDto).id;
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
