import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import type {
  AdminBusinessDto,
  AdminMetricPoint,
  AdminOrderDto,
  AdminProductDto,
  AdminStats,
  AdminUserDto,
  AuditLogDto,
  AuthResponse,
  CategoryDetailDto,
  CategoryDto,
  OrderDto,
  Page,
  ProductDetailDto,
  SellerDashboard,
} from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ADDRESS = {
  street: 'Calle Panel',
  number: '1',
  city: 'CABA',
  province: 'Buenos Aires',
  zipCode: '1000',
};

describe('Paneles admin y vendedor (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const stamp = Date.now();
  const sellerEmail = `e2e-panel-seller-${stamp}@test.com`;
  const buyerEmail = `e2e-panel-buyer-${stamp}@test.com`;
  const adminEmail = `e2e-panel-admin-${stamp}@test.com`;
  const victimEmail = `e2e-panel-victim-${stamp}@test.com`;
  const allEmails = [sellerEmail, buyerEmail, adminEmail, victimEmail];

  let sellerToken: string;
  let buyerToken: string;
  let adminToken: string;
  let categoryId: string;
  let productId: string;

  async function register(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'super-secreta-123', name: 'Panel E2E' })
      .expect(201);
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
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
      data: { name: 'Cat Panel E2E', slug: `e2e-panel-${stamp}` },
    });
    categoryId = category.id;

    sellerToken = await register(sellerEmail);
    buyerToken = await register(buyerEmail);
    await register(victimEmail);

    await register(adminEmail);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'super-secreta-123' })
      .expect(200);
    adminToken = (adminLogin.body as AuthResponse).accessToken;

    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: `Panel Shop ${stamp}` })
      .expect(201);
    const prod = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: `Lampara velador ${stamp}`,
        categoryId,
        variants: [{ priceCents: 1000000, stock: 10 }],
      })
      .expect(201);
    productId = (prod.body as ProductDetailDto).id;
  });

  afterAll(async () => {
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

  // ── Variantes ────────────────────────────────────────────

  it('el vendedor agrega, edita y borra variantes', async () => {
    const added = await request(app.getHttpServer())
      .post(`/products/${productId}/variants`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        attributes: { color: 'negro' },
        priceCents: 1200000,
        stock: 5,
      })
      .expect(201);
    const product = added.body as ProductDetailDto;
    expect(product.variants).toHaveLength(2);

    const newVariant = product.variants.find((v) => !v.isDefault)!;
    const deleted = await request(app.getHttpServer())
      .delete(`/products/${productId}/variants/${newVariant.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    expect((deleted.body as ProductDetailDto).variants).toHaveLength(1);

    // la última variante no se puede borrar
    const last = (deleted.body as ProductDetailDto).variants[0];
    await request(app.getHttpServer())
      .delete(`/products/${productId}/variants/${last.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(409);
  });

  it('una variante con ventas no se puede borrar', async () => {
    // segunda variante + compra de la misma
    const added = await request(app.getHttpServer())
      .post(`/products/${productId}/variants`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ attributes: { color: 'blanco' }, priceCents: 900000, stock: 3 })
      .expect(201);
    const variant = (added.body as ProductDetailDto).variants.find(
      (v) => !v.isDefault,
    )!;

    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ variantId: variant.id, quantity: 1 })
      .expect(201);
    const checkout = await request(app.getHttpServer())
      .post('/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(ADDRESS)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/orders/${(checkout.body as OrderDto).id}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/products/${productId}/variants/${variant.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(409);
  });

  // ── Dashboard del vendedor ───────────────────────────────

  it('el dashboard del vendedor refleja la venta', async () => {
    const res = await request(app.getHttpServer())
      .get('/businesses/me/dashboard')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    const dashboard = res.body as SellerDashboard;
    expect(dashboard.revenueCents).toBe(900000);
    expect(dashboard.salesCount).toBe(1);
    expect(dashboard.pendingSalesCount).toBe(1);
    expect(dashboard.activeProducts).toBe(1);
    expect(dashboard.lowStockVariants).toBeGreaterThanOrEqual(1); // quedó stock 2
    expect(dashboard.recentSales).toHaveLength(1);
  });

  // ── Admin: usuarios, listados, GMV ───────────────────────

  it('el admin lista y busca usuarios', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: `e2e-panel-seller-${stamp}` })
      .expect(200);
    const page = res.body as Page<AdminUserDto>;
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(1);
    expect(page.items[0].businessName).toContain('Panel Shop');
  });

  it('suspender un usuario bloquea su login y mata sus sesiones', async () => {
    const victim = await prisma.user.findUniqueOrThrow({
      where: { email: victimEmail },
    });

    await request(app.getHttpServer())
      .patch(`/admin/users/${victim.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: victimEmail, password: 'super-secreta-123' })
      .expect(401);

    const tokens = await prisma.refreshToken.count({
      where: { userId: victim.id },
    });
    expect(tokens).toBe(0);

    // reactivar y vuelve a entrar
    await request(app.getHttpServer())
      .patch(`/admin/users/${victim.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' })
      .expect(204);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: victimEmail, password: 'super-secreta-123' })
      .expect(200);
  });

  it('el admin no puede suspenderse ni cambiarse el rol a sí mismo', async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
    });
    await request(app.getHttpServer())
      .patch(`/admin/users/${admin.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' })
      .expect(409);
    await request(app.getHttpServer())
      .patch(`/admin/users/${admin.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'USER' })
      .expect(409);
  });

  it('listados de negocios, productos y órdenes + GMV en stats', async () => {
    const businesses = await request(app.getHttpServer())
      .get('/admin/businesses')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: `Panel Shop ${stamp}` })
      .expect(200);
    expect((businesses.body as Page<AdminBusinessDto>).items).toHaveLength(1);

    const products = await request(app.getHttpServer())
      .get('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: `Lampara velador ${stamp}` })
      .expect(200);
    expect((products.body as Page<AdminProductDto>).items).toHaveLength(1);

    const orders = await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      (orders.body as Page<AdminOrderDto>).items.length,
    ).toBeGreaterThanOrEqual(1);

    const stats = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((stats.body as AdminStats).gmvCents).toBeGreaterThanOrEqual(900000);
  });

  it('las acciones de moderación quedan en el log de auditoría', async () => {
    // las suspensiones del test anterior dejaron rastro
    const res = await request(app.getHttpServer())
      .get('/admin/audit')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const audit = res.body as Page<AuditLogDto>;
    expect(audit.total).toBeGreaterThanOrEqual(1);
    expect(
      audit.items.some(
        (log) => log.action === 'USER_STATUS' && log.targetType === 'USER',
      ),
    ).toBe(true);
  });

  it('las métricas devuelven una serie de 14 días', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const points = res.body as AdminMetricPoint[];
    expect(points).toHaveLength(14);
    // el día de hoy tiene al menos la orden pagada de esta suite
    expect(points.reduce((sum, p) => sum + p.orders, 0)).toBeGreaterThanOrEqual(
      1,
    );
  });

  it('ABM de categorías: solo admin crea, renombra y borra (con guardas)', async () => {
    // un usuario común no puede crear
    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: `Sin permiso ${stamp}` })
      .expect(403);

    const parent = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `ABM Padre ${stamp}` })
      .expect(201);
    const parentId = (parent.body as CategoryDto).id;

    // renombrar
    const renamed = await request(app.getHttpServer())
      .patch(`/categories/${parentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `ABM Padre Editado ${stamp}` })
      .expect(200);
    expect((renamed.body as CategoryDto).name).toContain('Editado');

    // crear hija
    const child = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `ABM Hija ${stamp}`, parentId })
      .expect(201);
    const childId = (child.body as CategoryDto).id;

    // el detalle público expone padre e hijas
    const detail = await request(app.getHttpServer())
      .get(`/categories/${(renamed.body as CategoryDto).slug}`)
      .expect(200);
    expect((detail.body as CategoryDetailDto).children).toHaveLength(1);

    // no se puede borrar el padre con hijas
    await request(app.getHttpServer())
      .delete(`/categories/${parentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    // borrar hija y luego padre
    await request(app.getHttpServer())
      .delete(`/categories/${childId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/categories/${parentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });
});
