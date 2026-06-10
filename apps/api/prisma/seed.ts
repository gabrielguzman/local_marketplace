import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Árbol de 2 niveles. Idempotente: upsert por slug.
const CATEGORIES: Record<string, string[]> = {
  Tecnología: ['Celulares', 'Computación', 'Audio y TV'],
  Hogar: ['Muebles', 'Cocina', 'Jardín'],
  Indumentaria: ['Hombre', 'Mujer', 'Niños'],
  Alimentos: ['Almacén', 'Bebidas', 'Frescos'],
  Deportes: ['Fitness', 'Ciclismo', 'Camping'],
};

function slugOf(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
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

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
