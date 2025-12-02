/*
  Warnings:

  - You are about to drop the column `phoneNumbers` on the `Shop` table. All the data in the column will be lost.
  - Added the required column `category` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactInfo` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."IdentifierType" AS ENUM ('USER', 'DEVICE_ID');

-- AlterTable
ALTER TABLE "public"."Shop" DROP COLUMN "phoneNumbers",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "contactInfo" JSONB NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."ShopDailyStat" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "viewTimeSec" INTEGER NOT NULL DEFAULT 0,
    "taps" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShopDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopRanking" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserShopDailyInteraction" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifierType" "public"."IdentifierType" NOT NULL,
    "shopId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressionCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "viewTimeSec" INTEGER NOT NULL DEFAULT 0,
    "tapCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserShopDailyInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopDailyStat_shopId_date_idx" ON "public"."ShopDailyStat"("shopId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDailyStat_shopId_date_key" ON "public"."ShopDailyStat"("shopId", "date");

-- CreateIndex
CREATE INDEX "ShopRanking_type_date_rank_idx" ON "public"."ShopRanking"("type", "date", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ShopRanking_shopId_type_date_key" ON "public"."ShopRanking"("shopId", "type", "date");

-- CreateIndex
CREATE INDEX "UserShopDailyInteraction_date_idx" ON "public"."UserShopDailyInteraction"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserShopDailyInteraction_identifier_identifierType_shopId_d_key" ON "public"."UserShopDailyInteraction"("identifier", "identifierType", "shopId", "date");

-- AddForeignKey
ALTER TABLE "public"."Shop" ADD CONSTRAINT "Shop_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopDailyStat" ADD CONSTRAINT "ShopDailyStat_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopRanking" ADD CONSTRAINT "ShopRanking_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
