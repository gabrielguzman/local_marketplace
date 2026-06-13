-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "guestToken" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "carts_guestToken_key" ON "carts"("guestToken");
