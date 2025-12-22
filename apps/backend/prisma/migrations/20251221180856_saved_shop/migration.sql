-- CreateTable
CREATE TABLE "public"."SavedShop" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedShop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedShop_userId_idx" ON "public"."SavedShop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedShop_userId_shopId_key" ON "public"."SavedShop"("userId", "shopId");

-- AddForeignKey
ALTER TABLE "public"."SavedShop" ADD CONSTRAINT "SavedShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
