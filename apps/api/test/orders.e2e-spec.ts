import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import type {
  AuthResponse,
  CartDto,
  OrderDto,
  ProductDetailDto,
  SellerSubOrderDto,
} from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ADDRESS = {
  street: 'Av. Siempreviva',
  number: '742',
  city: 'Springfield',
  province: 'Buenos Aires',
  zipCode: '1900',
};

describe('Cart & Orders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const stamp = Date.now();
  const buyerEmail = `e2e-buyer-${stamp}@test.com`;
  const seller1Email = `e2e-seller1-${stamp}@test.com`;
  const seller2Email = `e2e-seller2-${stamp}@test.com`;
  const allEmails = [buyerEmail, seller1Email, seller2Email];

  let buyerToken: string;
  let seller1Token: string;
  let categoryId: string;
  let variant1Id: string; // del negocio 1, stock 5
  let variant2Id: string; // del negocio 2, stock 3
  let orderId: string;

  async function register(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'super-secreta-123', name: 'E2E' })
      .expect(201);
    return (res.body as AuthResponse).accessToken;
  }

  async function createSellerWithProduct(
    token: string,
    businessName: string,
    title: string,
    stock: number,
    priceCents: number,
  ): Promise<string> {
    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: businessName })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title,
        categoryId,
        variants: [{ priceCents, stock }],
      })
      .expect(201);
    return (res.body as ProductDetailDto).variants[0].id;
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
      data: { name: 'Cat Orders E2E', slug: `e2e-orders-${stamp}` },
    });
    categoryId = category.id;

    buyerToken = await register(buyerEmail);
    seller1Token = await register(seller1Email);
    const seller2Token = await register(seller2Email);

    variant1Id = await createSellerWithProduct(
      seller1Token,
      `Negocio Uno ${stamp}`,
      `Mate imperial ${stamp}`,
      5,
      1500000,
    );
    variant2Id = await createSellerWithProduct(
      seller2Token,
      `Negocio Dos ${stamp}`,
      `Termo acero ${stamp}`,
      3,
      4200000,
    );
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { subOrder: { order: { buyer: { email: buyerEmail } } } },
    });
    await prisma.payment.deleteMany({
      where: { order: { buyer: { email: buyerEmail } } },
    });
    await prisma.subOrder.deleteMany({
      where: { order: { buyer: { email: buyerEmail } } },
    });
    await prisma.order.deleteMany({
      where: { buyer: { email: buyerEmail } },
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

  it('arma un carrito con productos de dos negocios', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ variantId: variant1Id, quantity: 2 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ variantId: variant2Id, quantity: 1 })
      .expect(201);

    const cart = res.body as CartDto;
    expect(cart.items).toHaveLength(2);
    expect(cart.totalCents).toBe(2 * 1500000 + 4200000);
  });

  it('rechaza cantidades por encima del stock', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ variantId: variant2Id, quantity: 99 })
      .expect(400);
  });

  it('checkout crea la orden con una sub-orden por negocio y vacía el carrito', async () => {
    const res = await request(app.getHttpServer())
      .post('/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(ADDRESS)
      .expect(201);

    const order = res.body as OrderDto;
    orderId = order.id;
    expect(order.status).toBe('PENDING_PAYMENT');
    expect(order.subOrders).toHaveLength(2);
    expect(order.totalCents).toBe(7200000);
    expect(order.paymentStatus).toBe('PENDING');

    const cart = await request(app.getHttpServer())
      .get('/cart')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect((cart.body as CartDto).items).toHaveLength(0);
  });

  it('el vendedor NO ve la venta antes del pago', async () => {
    const res = await request(app.getHttpServer())
      .get('/businesses/me/suborders')
      .set('Authorization', `Bearer ${seller1Token}`)
      .expect(200);
    expect(res.body as SellerSubOrderDto[]).toHaveLength(0);
  });

  it('el pago aprueba la orden y descuenta stock', async () => {
    const res = await request(app.getHttpServer())
      .post(`/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const order = res.body as OrderDto;
    expect(order.status).toBe('PAID');
    expect(order.paymentStatus).toBe('APPROVED');

    const variant = await prisma.productVariant.findUnique({
      where: { id: variant1Id },
    });
    expect(variant?.stock).toBe(3); // 5 - 2

    // pagar dos veces no se puede
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(409);
  });

  it('ahora el vendedor ve su venta y avanza el estado', async () => {
    const sales = await request(app.getHttpServer())
      .get('/businesses/me/suborders')
      .set('Authorization', `Bearer ${seller1Token}`)
      .expect(200);

    const list = sales.body as SellerSubOrderDto[];
    expect(list).toHaveLength(1);
    expect(list[0].subtotalCents).toBe(3000000);
    expect(list[0].shippingAddress.city).toBe('Springfield');

    const subOrderId = list[0].id;

    // PENDING → SHIPPED salteando CONFIRMED: inválido
    await request(app.getHttpServer())
      .patch(`/suborders/${subOrderId}/status`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ status: 'SHIPPED' })
      .expect(409);

    for (const status of ['CONFIRMED', 'SHIPPED', 'DELIVERED'] as const) {
      const res = await request(app.getHttpServer())
        .patch(`/suborders/${subOrderId}/status`)
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({ status })
        .expect(200);
      expect((res.body as SellerSubOrderDto).status).toBe(status);
    }
  });

  it('el comprador ve su orden con los snapshots', async () => {
    const res = await request(app.getHttpServer())
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const order = res.body as OrderDto;
    const titles = order.subOrders.flatMap((s) => s.items.map((i) => i.title));
    expect(titles.some((t) => t.startsWith('Mate imperial'))).toBe(true);
    expect(titles.some((t) => t.startsWith('Termo acero'))).toBe(true);
  });

  it('si el stock se agota antes del pago, la orden se cancela', async () => {
    // quedan 3 del variant2: las pongo en el carrito y pago DESPUÉS de
    // que otra compra (simulada por SQL) agote el stock
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ variantId: variant2Id, quantity: 2 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(ADDRESS)
      .expect(201);
    const pendingOrder = checkout.body as OrderDto;

    await prisma.productVariant.update({
      where: { id: variant2Id },
      data: { stock: 1 },
    });

    await request(app.getHttpServer())
      .post(`/orders/${pendingOrder.id}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(409);

    const after = await request(app.getHttpServer())
      .get(`/orders/${pendingOrder.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect((after.body as OrderDto).status).toBe('CANCELLED');
    expect((after.body as OrderDto).paymentStatus).toBe('REJECTED');
  });
});
