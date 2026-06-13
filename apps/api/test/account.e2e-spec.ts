import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import type {
  AddressDto,
  AuthResponse,
  CartDto,
  ProductDetailDto,
} from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const BASE_ADDRESS = {
  street: 'Av. Corrientes',
  number: '1234',
  city: 'CABA',
  province: 'Buenos Aires',
  zipCode: '1043',
};

describe('Account & Guest cart (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const stamp = Date.now();
  const userEmail = `e2e-acc-${stamp}@test.com`;
  const otherEmail = `e2e-acc-other-${stamp}@test.com`;
  const sellerEmail = `e2e-acc-seller-${stamp}@test.com`;
  const allEmails = [userEmail, otherEmail, sellerEmail];

  let userToken: string;
  let otherToken: string;
  let categoryId: string;
  let variantId: string;

  async function register(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'super-secreta-123', name: 'E2E' })
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
      data: { name: 'Cat Acc E2E', slug: `e2e-acc-${stamp}` },
    });
    categoryId = category.id;

    userToken = await register(userEmail);
    otherToken = await register(otherEmail);
    const sellerToken = await register(sellerEmail);

    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: `Negocio Acc ${stamp}` })
      .expect(201);
    const product = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: `Producto Acc ${stamp}`,
        categoryId,
        variants: [{ priceCents: 2000000, stock: 5 }],
      })
      .expect(201);
    variantId = (product.body as ProductDetailDto).variants[0].id;
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany({
      where: { variant: { product: { title: { contains: `Acc ${stamp}` } } } },
    });
    await prisma.cart.deleteMany({
      where: { user: { email: { in: allEmails } } },
    });
    await prisma.address.deleteMany({
      where: { user: { email: { in: allEmails } } },
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

  describe('Direcciones', () => {
    let firstId: string;

    it('la primera dirección nace como principal', async () => {
      const res = await request(app.getHttpServer())
        .post('/me/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(BASE_ADDRESS)
        .expect(201);
      const address = res.body as AddressDto;
      firstId = address.id;
      expect(address.isDefault).toBe(true);
    });

    it('una segunda con isDefault destrona a la primera', async () => {
      const res = await request(app.getHttpServer())
        .post('/me/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...BASE_ADDRESS, number: '5678', isDefault: true })
        .expect(201);
      expect((res.body as AddressDto).isDefault).toBe(true);

      const list = await request(app.getHttpServer())
        .get('/me/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const addresses = list.body as AddressDto[];
      expect(addresses).toHaveLength(2);
      expect(addresses.filter((a) => a.isDefault)).toHaveLength(1);
      expect(addresses.find((a) => a.id === firstId)?.isDefault).toBe(false);
    });

    it('borrar la principal promueve otra', async () => {
      const list = await request(app.getHttpServer())
        .get('/me/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const current = (list.body as AddressDto[]).find((a) => a.isDefault)!;

      await request(app.getHttpServer())
        .delete(`/me/addresses/${current.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);

      const after = await request(app.getHttpServer())
        .get('/me/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const addresses = after.body as AddressDto[];
      expect(addresses).toHaveLength(1);
      expect(addresses[0].isDefault).toBe(true);
    });

    it('otro usuario no puede tocar mi dirección', async () => {
      const list = await request(app.getHttpServer())
        .get('/me/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const mine = (list.body as AddressDto[])[0];

      await request(app.getHttpServer())
        .patch(`/me/addresses/${mine.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ city: 'Hackeada' })
        .expect(404);
    });
  });

  describe('Carrito de invitado', () => {
    const guestToken = randomUUID();

    it('sin identidad (ni token ni header) rechaza con 400', async () => {
      await request(app.getHttpServer()).get('/cart').expect(400);
    });

    it('un invitado arma su carrito con el header X-Guest-Cart', async () => {
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('X-Guest-Cart', guestToken)
        .send({ variantId, quantity: 2 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/cart')
        .set('X-Guest-Cart', guestToken)
        .expect(200);
      const cart = res.body as CartDto;
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('al loguearse se mergea el carrito de invitado en el del usuario', async () => {
      // el usuario ya tenía 1 unidad en su carrito
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ variantId, quantity: 1 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestToken })
        .expect(201);
      const cart = res.body as CartDto;
      // 1 (usuario) + 2 (invitado) = 3
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);

      // el carrito de invitado ya no existe
      const guest = await request(app.getHttpServer())
        .get('/cart')
        .set('X-Guest-Cart', guestToken)
        .expect(200);
      expect((guest.body as CartDto).items).toHaveLength(0);
    });
  });
});
