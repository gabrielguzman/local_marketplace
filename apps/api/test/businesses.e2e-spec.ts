import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import type { AuthResponse, BusinessDto } from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Businesses (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;

  const email = `e2e-biz-${Date.now()}@test.com`;

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

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'super-secreta-123', name: 'Dueño E2E' })
      .expect(201);
    accessToken = (res.body as AuthResponse).accessToken;
    // crear negocio requiere email verificado
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  });

  afterAll(async () => {
    await prisma.business.deleteMany({ where: { owner: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('crear negocio requiere autenticación', async () => {
    await request(app.getHttpServer())
      .post('/businesses')
      .send({ name: 'Sin Token' })
      .expect(401);
  });

  it('crea el negocio con slug a partir del nombre', async () => {
    const res = await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Almacén Doña Rosa', description: 'De barrio' })
      .expect(201);

    const biz = res.body as BusinessDto;
    expect(biz.slug).toBe('almacen-dona-rosa');
    expect(biz.status).toBe('ACTIVE');
  });

  it('no permite un segundo negocio por usuario', async () => {
    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Otro Negocio' })
      .expect(409);
  });

  it('la página pública por slug funciona sin auth', async () => {
    const res = await request(app.getHttpServer())
      .get('/businesses/almacen-dona-rosa')
      .expect(200);
    expect((res.body as BusinessDto).name).toBe('Almacén Doña Rosa');
  });

  it('el directorio público lista la tienda activa sin auth', async () => {
    const res = await request(app.getHttpServer())
      .get('/businesses')
      .expect(200);
    const list = res.body as { slug: string; productCount: number }[];
    const mine = list.find((b) => b.slug === 'almacen-dona-rosa');
    expect(mine).toBeDefined();
    expect(typeof mine!.productCount).toBe('number');
  });

  it('el directorio filtra tiendas por nombre con ?q', async () => {
    const match = await request(app.getHttpServer())
      .get('/businesses')
      .query({ q: 'doña' })
      .expect(200);
    expect(
      (match.body as { slug: string }[]).some(
        (b) => b.slug === 'almacen-dona-rosa',
      ),
    ).toBe(true);

    const noMatch = await request(app.getHttpServer())
      .get('/businesses')
      .query({ q: 'zzzzz-no-existe' })
      .expect(200);
    expect(
      (noMatch.body as { slug: string }[]).some(
        (b) => b.slug === 'almacen-dona-rosa',
      ),
    ).toBe(false);
  });

  it('el directorio filtra por provincia con near=1', async () => {
    const prov = `Prov-${Date.now()}`;
    await prisma.business.update({
      where: { slug: 'almacen-dona-rosa' },
      data: { province: prov, city: 'Ciudad Test' },
    });

    const res = await request(app.getHttpServer())
      .get('/businesses')
      .query({ province: prov, near: '1' })
      .expect(200);
    const list = res.body as { slug: string; province: string | null }[];
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((b) => b.province === prov)).toBe(true);
    expect(list.some((b) => b.slug === 'almacen-dona-rosa')).toBe(true);
  });

  it('GET /businesses/me devuelve el propio', async () => {
    const res = await request(app.getHttpServer())
      .get('/businesses/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect((res.body as BusinessDto).slug).toBe('almacen-dona-rosa');
  });

  it('PATCH /businesses/me actualiza el perfil completo del negocio', async () => {
    const res = await request(app.getHttpServer())
      .patch('/businesses/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        description: 'Abierto de 8 a 20',
        phone: '011 4123-4567',
        whatsapp: '+54 9 11 1234-5678',
        email: 'rosa@almacen.com',
        instagram: '@donarosa',
        city: 'Lanús',
        province: 'Buenos Aires',
        hours: 'Lun a Sáb de 8 a 20 hs',
        policies: 'Cambios dentro de las 48 hs con ticket.',
      })
      .expect(200);
    const biz = res.body as BusinessDto;
    expect(biz.phone).toBe('011 4123-4567');
    expect(biz.city).toBe('Lanús');
    expect(biz.policies).toContain('Cambios');

    // y aparece en la página pública
    const pub = await request(app.getHttpServer())
      .get('/businesses/almacen-dona-rosa')
      .expect(200);
    expect((pub.body as BusinessDto).hours).toBe('Lun a Sáb de 8 a 20 hs');
    expect((pub.body as BusinessDto).instagram).toBe('@donarosa');
  });

  it('slug inexistente devuelve 404', async () => {
    await request(app.getHttpServer())
      .get('/businesses/no-existe-este-slug')
      .expect(404);
  });
});
