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

  it('GET /businesses/me devuelve el propio', async () => {
    const res = await request(app.getHttpServer())
      .get('/businesses/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect((res.body as BusinessDto).slug).toBe('almacen-dona-rosa');
  });

  it('PATCH /businesses/me actualiza el perfil del negocio', async () => {
    const res = await request(app.getHttpServer())
      .patch('/businesses/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Abierto de 8 a 20' })
      .expect(200);
    expect((res.body as BusinessDto).description).toBe('Abierto de 8 a 20');
  });

  it('slug inexistente devuelve 404', async () => {
    await request(app.getHttpServer())
      .get('/businesses/no-existe-este-slug')
      .expect(404);
  });
});
