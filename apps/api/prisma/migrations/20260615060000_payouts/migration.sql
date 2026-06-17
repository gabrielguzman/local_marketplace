-- AlterTable
ALTER TABLE "sub_orders" ADD COLUMN     "payoutId" TEXT;

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payouts_businessId_idx" ON "payouts"("businessId");

-- CreateIndex
CREATE INDEX "sub_orders_payoutId_idx" ON "sub_orders"("payoutId");

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
