/*
  Warnings:

  - You are about to drop the `StockPosition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockPosition" DROP CONSTRAINT "StockPosition_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockPosition" DROP CONSTRAINT "StockPosition_storeId_fkey";

-- DropTable
DROP TABLE "StockPosition";

-- CreateTable
CREATE TABLE "stock_positions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "manufactured" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_positions_storeId_productId_idx" ON "stock_positions"("storeId", "productId");

-- CreateIndex
CREATE INDEX "stock_positions_productId_idx" ON "stock_positions"("productId");

-- CreateIndex
CREATE INDEX "stock_positions_expiryDate_idx" ON "stock_positions"("expiryDate");

-- AddForeignKey
ALTER TABLE "stock_positions" ADD CONSTRAINT "stock_positions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_positions" ADD CONSTRAINT "stock_positions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
