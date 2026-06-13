-- AlterTable: respuesta del vendedor + updatedAt
ALTER TABLE "reviews" ADD COLUMN     "sellerRespondedAt" TIMESTAMP(3),
ADD COLUMN     "sellerResponse" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- backfill listo: Prisma maneja updatedAt en la app, sacamos el default
ALTER TABLE "reviews" ALTER COLUMN "updatedAt" DROP DEFAULT;
