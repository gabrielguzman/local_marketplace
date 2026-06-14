// Limpieza de datos de desarrollo: vacía todas las tablas de dominio.
// No toca el historial de migraciones. Uso: ts-node prisma/reset-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TABLES = [
  'notifications',
  'review_votes',
  'review_reports',
  'reviews',
  'reports',
  'questions',
  'favorites',
  'order_items',
  'payments',
  'sub_orders',
  'orders',
  'cart_items',
  'carts',
  'product_images',
  'product_variants',
  'products',
  'categories',
  'addresses',
  'businesses',
  'audit_logs',
  'verification_tokens',
  'refresh_tokens',
  'users',
];

async function main() {
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`,
  );
  console.log(`Tablas vaciadas (${TABLES.length}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
