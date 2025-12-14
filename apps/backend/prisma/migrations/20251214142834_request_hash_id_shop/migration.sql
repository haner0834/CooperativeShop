/*
  Warnings:

  - A unique constraint covering the columns `[requestHashId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
-- 1️⃣ 安裝 pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2️⃣ 新增欄位，允許 NULL
ALTER TABLE "public"."Shop" ADD COLUMN "requestHashId" TEXT;

-- 3️⃣ 為現有資料填入唯一 UUID
UPDATE "public"."Shop" SET "requestHashId" = gen_random_uuid();

-- 4️⃣ 設為 NOT NULL
ALTER TABLE "public"."Shop" ALTER COLUMN "requestHashId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_requestHashId_key" ON "public"."Shop"("requestHashId");
