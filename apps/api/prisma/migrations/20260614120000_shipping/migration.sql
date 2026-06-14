-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('PICKUP', 'SHIPPING', 'TO_AGREE');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "pickupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingCents" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sub_orders" ADD COLUMN     "shippingCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'TO_AGREE';

