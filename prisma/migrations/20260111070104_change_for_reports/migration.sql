-- CreateIndex
CREATE INDEX "Order_storeId_createdAt_idx" ON "Order"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "UnfulfilledItem_orderId_idx" ON "UnfulfilledItem"("orderId");

-- CreateIndex
CREATE INDEX "UnfulfilledItem_productId_createdAt_idx" ON "UnfulfilledItem"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "UnfulfilledItem_storeId_createdAt_idx" ON "UnfulfilledItem"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "UnfulfilledItem" ADD CONSTRAINT "UnfulfilledItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
