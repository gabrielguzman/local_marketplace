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

// Datos de demo (solo si no hay ningún producto cargado)
const DEMO_PRODUCTS: {
  title: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  stock: number;
}[] = [
  {
    title: 'Celular X20 128GB Negro',
    description: 'Pantalla AMOLED de 6,5", 8GB de RAM y cámara triple de 50MP.',
    categorySlug: 'tecnologia-celulares',
    priceCents: 45000000,
    stock: 15,
  },
  {
    title: 'Notebook 14" Ryzen 5 16GB',
    description: 'Liviana y rápida, ideal para trabajo y estudio. SSD de 512GB.',
    categorySlug: 'tecnologia-computacion',
    priceCents: 89999900,
    stock: 7,
  },
  {
    title: 'Auriculares Bluetooth con cancelación de ruido',
    description: 'Hasta 30 horas de batería y estuche de carga rápida.',
    categorySlug: 'tecnologia-audio-y-tv',
    priceCents: 7850000,
    stock: 32,
  },
  {
    title: 'Mesa ratona de madera maciza',
    description: 'Paraíso lustrado, 90x50cm. Hecha a mano.',
    categorySlug: 'hogar-muebles',
    priceCents: 12500000,
    stock: 4,
  },
  {
    title: 'Cafetera express 19 bares',
    description: 'Con espumador de leche y portafiltro doble.',
    categorySlug: 'hogar-cocina',
    priceCents: 18999000,
    stock: 11,
  },
  {
    title: 'Bicicleta rodado 28 21 cambios',
    description: 'Cuadro de aluminio, frenos a disco. Lista para usar.',
    categorySlug: 'deportes-ciclismo',
    priceCents: 35000000,
    stock: 6,
  },
  {
    title: 'Zapatillas running ultralivianas',
    description: 'Suela con retorno de energía, talles 38 al 45.',
    categorySlug: 'deportes-fitness',
    priceCents: 9899900,
    stock: 25,
  },
  {
    title: 'Yerba mate orgánica 1kg',
    description: 'Estacionada 24 meses, sin polvo. Directo del productor.',
    categorySlug: 'alimentos-almacen',
    priceCents: 850000,
    stock: 120,
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
  if ((await prisma.product.count()) > 0) {
    console.log('Ya hay productos, salteo los datos de demo.');
    return;
  }

  const owner = await prisma.user.upsert({
    where: { email: 'demo@marketplace.local' },
    update: {},
    create: {
      email: 'demo@marketplace.local',
      name: 'Tienda Demo',
      passwordHash: await argon2.hash('demo-marketplace-123'),
    },
  });

  const business = await prisma.business.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Tienda Demo',
      slug: 'tienda-demo',
      description: 'Productos de muestra para el desarrollo del marketplace.',
      status: 'ACTIVE',
    },
  });

  for (const demo of DEMO_PRODUCTS) {
    const category = await prisma.category.findUnique({
      where: { slug: demo.categorySlug },
    });
    if (!category) continue;

    const slug = slugOf(demo.title);
    await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: category.id,
        title: demo.title,
        slug,
        description: demo.description,
        status: 'ACTIVE',
        variants: {
          create: [
            { priceCents: demo.priceCents, stock: demo.stock, isDefault: true },
          ],
        },
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/${slug}/600/450`,
              position: 0,
            },
          ],
        },
      },
    });
  }
  console.log(`Datos de demo sembrados (${DEMO_PRODUCTS.length} productos).`);
}

async function main() {
  await seedCategories();
  await seedDemoData();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
