import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import type { AuthResponse, UserDto } from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = `e2e-${Date.now()}@test.com`;
  const password = 'super-secreta-123';

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  function refreshCookieOf(res: request.Response): string {
    const cookies = res.get('Set-Cookie') ?? [];
    const cookie = cookies.find((c) => c.startsWith('refresh_token='));
    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    return cookie!.split(';')[0];
  }

  it('rechaza un registro inválido', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'no-es-email', password: 'corta', name: 'x' })
      .expect(400);
  });

  it('registra, devuelve access token y setea cookie de refresh', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'Usuario E2E' })
      .expect(201);

    const body = res.body as AuthResponse;
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe(email);
    refreshCookieOf(res);
  });

  it('no permite registrar el mismo email dos veces', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'Duplicado' })
      .expect(409);
  });

  it('login con credenciales correctas e incorrectas', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'incorrecta!' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
  });

  it('GET /me requiere token y devuelve el usuario', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken } = login.body as AuthResponse;

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect((me.body as UserDto).email).toBe(email);
  });

  it('PATCH /me actualiza el perfil', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken } = login.body as AuthResponse;

    const res = await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Nombre Nuevo', phone: '+54 11 5555-5555' })
      .expect(200);

    const user = res.body as UserDto;
    expect(user.name).toBe('Nombre Nuevo');
    expect(user.phone).toBe('+54 11 5555-5555');
  });

  it('refresh rota el token: el viejo deja de servir', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const oldCookie = refreshCookieOf(login);

    // Primer refresh: funciona y entrega cookie nueva
    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(200);
    expect((refreshed.body as AuthResponse).accessToken).toBeTruthy();
    const newCookie = refreshCookieOf(refreshed);
    expect(newCookie).not.toBe(oldCookie);

    // Reusar el viejo: rechazado (single-use)
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(401);

    // El nuevo sigue sirviendo
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', newCookie)
      .expect(200);
  });

  it('logout invalida el refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = refreshCookieOf(login);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookie)
      .expect(401);
  });
});
