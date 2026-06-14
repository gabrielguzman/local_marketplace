import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import type {
  AuthResponse,
  Paginated,
  ProductDetailDto,
  ProductSummaryDto,
} from '@marketplace/shared';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let categoryId: string;
  let categorySlug: string;
  let productId: string;
  let productSlug: string;

  const stamp = Date.now();
  const email = `e2e-prod-${stamp}@test.com`;

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

    const auth = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'super-secreta-123', name: 'Vendedor E2E' })
      .expect(201);
    accessToken = (auth.body as AuthResponse).accessToken;
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });

    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Ferretería E2E ${stamp}` })
      .expect(201);

    categorySlug = `e2e-cat-${stamp}`;
    const category = await prisma.category.create({
      data: { name: 'Categoría E2E', slug: categorySlug },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: { business: { owner: { email } } },
    });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.business.deleteMany({ where: { owner: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('crea un producto con ficha completa: variantes, marca, condición y specs', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `Taladro Percutor Inalámbrico ${stamp}`,
        description: 'Taladro de 20V con dos baterías de litio',
        categoryId,
        brand: 'Bauker',
        condition: 'USED',
        specs: [
          { key: 'Voltaje', value: '20V' },
          { key: 'Garantía', value: '6 meses' },
        ],
        images: ['https://example.com/taladro-1.jpg'],
        variants: [
          { attributes: { voltaje: '20V' }, priceCents: 8500000, stock: 10 },
          { attributes: { voltaje: '12V' }, priceCents: 6200000, stock: 5 },
        ],
      })
      .expect(201);

    const product = res.body as ProductDetailDto;
    expect(product.variants).toHaveLength(2);
    expect(product.variants[0].isDefault).toBe(true);
    expect(product.images).toHaveLength(1);
    expect(product.brand).toBe('Bauker');
    expect(product.condition).toBe('USED');
    expect(product.specs).toEqual([
      { key: 'Voltaje', value: '20V' },
      { key: 'Garantía', value: '6 meses' },
    ]);
    productId = product.id;
    productSlug = product.slug;
  });

  it('busca por marca y filtra por condición', async () => {
    // la marca está en el índice full-text aunque no esté en el título
    const byBrand = await request(app.getHttpServer())
      .get('/search')
      .query({ q: `Bauker ${stamp}` })
      .expect(200);
    expect(
      (byBrand.body as Paginated<ProductSummaryDto>).items.some(
        (p) => p.id === productId,
      ),
    ).toBe(true);

    // filtro condición=USED lo incluye; NEW lo excluye
    const used = await request(app.getHttpServer())
      .get('/search')
      .query({ category: categorySlug, condition: 'USED' })
      .expect(200);
    expect(
      (used.body as Paginated<ProductSummaryDto>).items.some(
        (p) => p.id === productId,
      ),
    ).toBe(true);

    const isNew = await request(app.getHttpServer())
      .get('/search')
      .query({ category: categorySlug, condition: 'NEW' })
      .expect(200);
    expect(
      (isNew.body as Paginated<ProductSummaryDto>).items.some(
        (p) => p.id === productId,
      ),
    ).toBe(false);
  });

  it('la página pública del producto funciona sin auth', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/${productSlug}`)
      .expect(200);
    expect((res.body as ProductDetailDto).business.slug).toContain(
      'ferreteria-e2e',
    );
  });

  it('la búsqueda full-text en español lo encuentra', async () => {
    // "taladros" (plural) debe matchear "Taladro" del título
    const res = await request(app.getHttpServer())
      .get('/search')
      .query({ q: `taladros inalambricos ${stamp}` })
      .expect(200);

    const page = res.body as Paginated<ProductSummaryDto>;
    expect(page.items.some((p) => p.id === productId)).toBe(true);
  });

  it('filtra por categoría y por precio', async () => {
    const byCategory = await request(app.getHttpServer())
      .get('/search')
      .query({ category: categorySlug })
      .expect(200);
    expect(
      (byCategory.body as Paginated<ProductSummaryDto>).items.some(
        (p) => p.id === productId,
      ),
    ).toBe(true);

    const tooExpensive = await request(app.getHttpServer())
      .get('/search')
      .query({ category: categorySlug, minPriceCents: 99999999 })
      .expect(200);
    expect(
      (tooExpensive.body as Paginated<ProductSummaryDto>).items,
    ).toHaveLength(0);
  });

  it('ordena por precio y por relevancia, y expone el rating', async () => {
    // segundo producto más barato en la misma categoría
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `Destornillador Manual ${stamp}`,
        description: 'Destornillador plano de acero templado',
        categoryId,
        variants: [{ priceCents: 1500000, stock: 8 }],
      })
      .expect(201);

    const asc = await request(app.getHttpServer())
      .get('/search')
      .query({ category: categorySlug, sort: 'price_asc' })
      .expect(200);
    const ascItems = (asc.body as Paginated<ProductSummaryDto>).items;
    expect(ascItems.map((p) => p.priceCents)).toEqual(
      [...ascItems.map((p) => p.priceCents)].sort((a, b) => a - b),
    );
    expect(ascItems[0].title).toContain('Destornillador');

    const desc = await request(app.getHttpServer())
      .get('/search')
      .query({ category: categorySlug, sort: 'price_desc' })
      .expect(200);
    expect((desc.body as Paginated<ProductSummaryDto>).items[0].id).toBe(
      productId,
    );

    const relevance = await request(app.getHttpServer())
      .get('/search')
      .query({ q: `taladro ${stamp}`, sort: 'relevance' })
      .expect(200);
    const relItems = (relevance.body as Paginated<ProductSummaryDto>).items;
    expect(relItems.some((p) => p.id === productId)).toBe(true);
    // los listados exponen el rating (sin reseñas todavía)
    expect(relItems[0].rating).toEqual({ avg: null, count: 0 });
  });

  it('favoritos: agregar (idempotente), listar y quitar', async () => {
    await request(app.getHttpServer())
      .put(`/me/favorites/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
    // segunda vez no rompe
    await request(app.getHttpServer())
      .put(`/me/favorites/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const list = await request(app.getHttpServer())
      .get('/me/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(
      (list.body as ProductSummaryDto[]).some((p) => p.id === productId),
    ).toBe(true);

    const ids = await request(app.getHttpServer())
      .get('/me/favorites/ids')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(ids.body as string[]).toContain(productId);

    await request(app.getHttpServer())
      .delete(`/me/favorites/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const after = await request(app.getHttpServer())
      .get('/me/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(after.body as ProductSummaryDto[]).toHaveLength(0);
  });

  it('autocompletado y búsqueda por atributo de variante', async () => {
    // producto cuyo color sólo vive en el atributo de la variante
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `Remera lisa ${stamp}`,
        description: 'De algodón',
        categoryId,
        variants: [
          { attributes: { color: 'violeta' }, priceCents: 500000, stock: 5 },
        ],
      })
      .expect(201);

    // autocompletado por título (substring del título)
    const suggest = await request(app.getHttpServer())
      .get('/search/suggest')
      .query({ q: `lisa ${stamp}` })
      .expect(200);
    expect(
      (suggest.body as { title: string }[]).some((s) =>
        s.title.includes('Remera lisa'),
      ),
    ).toBe(true);

    // "violeta" sólo está en el atributo: igual matchea
    const res = await request(app.getHttpServer())
      .get('/search')
      .query({ q: `remera violeta ${stamp}` })
      .expect(200);
    expect(
      (res.body as Paginated<ProductSummaryDto>).items.some((p) =>
        p.title.includes('Remera lisa'),
      ),
    ).toBe(true);
  });

  it('otro usuario no puede editar mi producto', async () => {
    const other = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-prod-otro-${stamp}@test.com`,
        password: 'super-secreta-123',
        name: 'Intruso',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set(
        'Authorization',
        `Bearer ${(other.body as AuthResponse).accessToken}`,
      )
      .send({ title: 'Producto Hackeado' })
      .expect(403);

    await prisma.user.deleteMany({
      where: { email: `e2e-prod-otro-${stamp}@test.com` },
    });
  });

  it('el dueño edita precio y stock de una variante', async () => {
    const detail = await request(app.getHttpServer())
      .get(`/products/${productSlug}`)
      .expect(200);
    const variantId = (detail.body as ProductDetailDto).variants[0].id;

    const res = await request(app.getHttpServer())
      .patch(`/products/${productId}/variants/${variantId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ priceCents: 9990000, stock: 42 })
      .expect(200);

    const updated = (res.body as ProductDetailDto).variants.find(
      (v) => v.id === variantId,
    );
    expect(updated?.priceCents).toBe(9990000);
    expect(updated?.stock).toBe(42);
  });

  it('PATCH con images reemplaza la galería completa', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        images: [
          'https://example.com/nueva-1.jpg',
          'https://example.com/nueva-2.jpg',
        ],
      })
      .expect(200);

    const product = res.body as ProductDetailDto;
    expect(product.images).toHaveLength(2);
    expect(product.images[0].url).toBe('https://example.com/nueva-1.jpg');
  });

  it('pausar el producto lo saca del público', async () => {
    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PAUSED' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/products/${productSlug}`)
      .expect(404);

    // pero sigue en "mis productos"
    const mine = await request(app.getHttpServer())
      .get('/products/mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(
      (mine.body as ProductDetailDto[]).some((p) => p.id === productId),
    ).toBe(true);
  });

  it('soft delete: 404 público y desaparece de mis productos', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const mine = await request(app.getHttpServer())
      .get('/products/mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(
      (mine.body as ProductDetailDto[]).some((p) => p.id === productId),
    ).toBe(false);
  });
});
