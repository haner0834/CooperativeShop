/*
  Warnings:

  - A unique constraint covering the columns `[requestHashId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Shop" ADD COLUMN     "requestHashId" TEXT NOT NULL DEFAULT 'hash_id';

-- CreateIndex
CREATE UNIQUE INDEX "Shop_requestHashId_key" ON "public"."Shop"("requestHashId");
