-- DropForeignKey
ALTER TABLE "public"."ShopImage" DROP CONSTRAINT "ShopImage_shopId_fkey";

-- AddForeignKey
ALTER TABLE "public"."ShopImage" ADD CONSTRAINT "ShopImage_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
