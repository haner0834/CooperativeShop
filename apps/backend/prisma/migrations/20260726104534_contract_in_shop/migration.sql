/*
  Warnings:

  - A unique constraint covering the columns `[contractFileId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "contractFileId" TEXT;

-- AlterTable
ALTER TABLE "ShopDraft" ADD COLUMN     "contract" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_contractFileId_key" ON "Shop"("contractFileId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_contractFileId_fkey" FOREIGN KEY ("contractFileId") REFERENCES "FileRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
