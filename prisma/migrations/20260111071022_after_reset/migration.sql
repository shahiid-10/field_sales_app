-- DropForeignKey
ALTER TABLE "UnfulfilledItem" DROP CONSTRAINT "UnfulfilledItem_orderId_fkey";

-- AddForeignKey
ALTER TABLE "UnfulfilledItem" ADD CONSTRAINT "UnfulfilledItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
