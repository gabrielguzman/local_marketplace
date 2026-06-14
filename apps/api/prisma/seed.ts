import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Árbol de 2 niveles. Idempotente: upsert por slug.
const CATEGORIES: Record<string, string[]> = {
  Tecnología: ['Celulares', 'Computación', 'Audio y TV'],
  Hogar: ['Muebles', 'Cocina', 'Jardín'],
  Indumentaria: ['Hombre', 'Mujer', 'Niños'],
  Alimentos: ['Almacén', 'Bebidas', 'Frescos'],
  Deportes: ['Fitness', 'Ciclismo', 'Camping'],
};

type Spec = { key: string; value: string };
type Variant = { attributes?: Record<string, string>; stock: number };

// Datos de demo (solo si no hay ningún producto cargado)
const DEMO_PRODUCTS: {
  title: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  stock: number;
  brand?: string;
  condition?: 'NEW' | 'USED';
  specs?: Spec[];
  variants?: Variant[]; // si viene, reemplaza la variante única
}[] = [
  {
    title: 'Celular X20 128GB Negro',
    description: 'Pantalla AMOLED de 6,5", 8GB de RAM y cámara triple de 50MP.',
    categorySlug: 'tecnologia-celulares',
    priceCents: 45000000,
    stock: 15,
    brand: 'Samsung',
    specs: [
      { key: 'Pantalla', value: '6,5" AMOLED' },
      { key: 'Memoria', value: '128 GB' },
      { key: 'RAM', value: '8 GB' },
      { key: 'Cámara', value: 'Triple 50 MP' },
    ],
    variants: [
      { attributes: { color: 'Negro' }, stock: 15 },
      { attributes: { color: 'Azul' }, stock: 8 },
    ],
  },
  {
    title: 'Notebook 14" Ryzen 5 16GB',
    description: 'Liviana y rápida, ideal para trabajo y estudio. SSD de 512GB.',
    categorySlug: 'tecnologia-computacion',
    priceCents: 89999900,
    stock: 7,
    brand: 'Lenovo',
    specs: [
      { key: 'Procesador', value: 'AMD Ryzen 5' },
      { key: 'RAM', value: '16 GB' },
      { key: 'Almacenamiento', value: 'SSD 512 GB' },
      { key: 'Garantía', value: '12 meses' },
    ],
  },
  {
    title: 'Auriculares Bluetooth con cancelación de ruido',
    description: 'Hasta 30 horas de batería y estuche de carga rápida.',
    categorySlug: 'tecnologia-audio-y-tv',
    priceCents: 7850000,
    stock: 32,
    brand: 'JBL',
    specs: [
      { key: 'Batería', value: '30 horas' },
      { key: 'Conectividad', value: 'Bluetooth 5.3' },
    ],
  },
  {
    title: 'Mesa ratona de madera maciza',
    description: 'Paraíso lustrado, 90x50cm. Hecha a mano.',
    categorySlug: 'hogar-muebles',
    priceCents: 12500000,
    stock: 4,
    specs: [
      { key: 'Material', value: 'Madera de paraíso' },
      { key: 'Medidas', value: '90 x 50 cm' },
    ],
  },
  {
    title: 'Cafetera express 19 bares',
    description: 'Con espumador de leche y portafiltro doble.',
    categorySlug: 'hogar-cocina',
    priceCents: 18999000,
    stock: 11,
    brand: 'Philips',
    specs: [
      { key: 'Presión', value: '19 bares' },
      { key: 'Potencia', value: '1450 W' },
    ],
  },
  {
    title: 'Bicicleta rodado 28 21 cambios',
    description: 'Cuadro de aluminio, frenos a disco. Usada, en muy buen estado.',
    categorySlug: 'deportes-ciclismo',
    priceCents: 35000000,
    stock: 1,
    brand: 'Vairo',
    condition: 'USED',
    specs: [
      { key: 'Rodado', value: '28' },
      { key: 'Cambios', value: '21' },
      { key: 'Cuadro', value: 'Aluminio' },
    ],
  },
  {
    title: 'Zapatillas running ultralivianas',
    description: 'Suela con retorno de energía, talles 38 al 45.',
    categorySlug: 'deportes-fitness',
    priceCents: 9899900,
    stock: 25,
    brand: 'Nike',
    specs: [{ key: 'Drop', value: '8 mm' }],
    variants: [
      { attributes: { talle: '40' }, stock: 10 },
      { attributes: { talle: '42' }, stock: 9 },
      { attributes: { talle: '44' }, stock: 6 },
    ],
  },
  {
    title: 'Yerba mate orgánica 1kg',
    description: 'Estacionada 24 meses, sin polvo. Directo del productor.',
    categorySlug: 'alimentos-almacen',
    priceCents: 850000,
    stock: 120,
    specs: [
      { key: 'Estacionamiento', value: '24 meses' },
      { key: 'Tipo', value: 'Orgánica, sin polvo' },
    ],
  },
];

function slugOf(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedCategories() {
  for (const [parentName, children] of Object.entries(CATEGORIES)) {
    const parent = await prisma.category.upsert({
      where: { slug: slugOf(parentName) },
      update: {},
      create: { name: parentName, slug: slugOf(parentName) },
    });
    for (const childName of children) {
      const childSlug = `${parent.slug}-${slugOf(childName)}`;
      await prisma.category.upsert({
        where: { slug: childSlug },
        update: {},
        create: { name: childName, slug: childSlug, parentId: parent.id },
      });
    }
  }
  console.log('Categorías sembradas.');
}

async function seedDemoData() {
  // el upsert del usuario demo corre SIEMPRE (aunque ya haya productos),
  // para que quede verificado
  const owner = await prisma.user.upsert({
    where: { email: 'demo@marketplace.local' },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: 'demo@marketplace.local',
      name: 'Tienda Demo',
      passwordHash: await argon2.hash('demo-marketplace-123'),
      emailVerifiedAt: new Date(),
    },
  });

  const businessProfile = {
    description:
      'Tienda de muestra del marketplace. Tecnología, hogar y más con envío a todo el país.',
    phone: '011 4555-1234',
    whatsapp: '+54 9 11 5555-1234',
    email: 'hola@tiendademo.com',
    website: 'tiendademo.com',
    instagram: '@tiendademo',
    address: 'Av. Corrientes 1234',
    city: 'CABA',
    province: 'Buenos Aires',
    hours: 'Lun a Vie de 9 a 18 hs · Sáb de 10 a 14 hs',
    policies:
      'Cambios y devoluciones dentro de los 30 días con el comprobante. Envíos a todo el país en 3 a 5 días hábiles.',
  };
  const business = await prisma.business.upsert({
    where: { ownerId: owner.id },
    update: businessProfile,
    create: {
      ownerId: owner.id,
      name: 'Tienda Demo',
      slug: 'tienda-demo',
      status: 'ACTIVE',
      ...businessProfile,
    },
  });

  for (const demo of DEMO_PRODUCTS) {
    const category = await prisma.category.findUnique({
      where: { slug: demo.categorySlug },
    });
    if (!category) continue;

    const slug = slugOf(demo.title);
    const variants = demo.variants ?? [{ stock: demo.stock }];

    // upsert idempotente: enriquece la ficha aunque el producto ya exista
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        description: demo.description,
        brand: demo.brand ?? null,
        condition: demo.condition ?? 'NEW',
        specs: demo.specs ?? [],
      },
      create: {
        businessId: business.id,
        categoryId: category.id,
        title: demo.title,
        slug,
        description: demo.description,
        brand: demo.brand ?? null,
        condition: demo.condition ?? 'NEW',
        specs: demo.specs ?? [],
        status: 'ACTIVE',
        variants: {
          create: variants.map((v, i) => ({
            priceCents: demo.priceCents,
            stock: v.stock,
            attributes: v.attributes ?? {},
            isDefault: i === 0,
          })),
        },
        images: {
          create: [
            { url: `https://picsum.photos/seed/${slug}/600/450`, position: 0 },
          ],
        },
      },
    });

    // si el producto ya existía con una sola variante, sumamos las extra
    if (variants.length > 1) {
      const count = await prisma.productVariant.count({
        where: { productId: product.id },
      });
      if (count <= 1) {
        for (const v of variants.slice(1)) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              priceCents: demo.priceCents,
              stock: v.stock,
              attributes: v.attributes ?? {},
            },
          });
        }
      }
    }
  }
  console.log(`Datos de demo sembrados (${DEMO_PRODUCTS.length} productos).`);
}

async function seedAdmin() {
  await prisma.user.upsert({
    where: { email: 'admin@marketplace.local' },
    update: { role: 'ADMIN', emailVerifiedAt: new Date() },
    create: {
      email: 'admin@marketplace.local',
      name: 'Admin',
      passwordHash: await argon2.hash('admin-marketplace-123'),
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Usuario admin listo (admin@marketplace.local).');
}

async function main() {
  await seedCategories();
  await seedAdmin();
  await seedDemoData();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
