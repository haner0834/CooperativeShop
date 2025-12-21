-- AlterTable
ALTER TABLE "public"."Shop" ADD COLUMN     "cachedHomeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cachedHotScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."WorkSchedule" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSchedule_shopId_dayOfWeek_idx" ON "public"."WorkSchedule"("shopId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Shop_schoolId_idx" ON "public"."Shop"("schoolId");

-- CreateIndex
CREATE INDEX "Shop_latitude_longitude_idx" ON "public"."Shop"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Shop_cachedHotScore_idx" ON "public"."Shop"("cachedHotScore");

-- CreateIndex
CREATE INDEX "Shop_cachedHomeScore_idx" ON "public"."Shop"("cachedHomeScore");

-- AddForeignKey
ALTER TABLE "public"."WorkSchedule" ADD CONSTRAINT "WorkSchedule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
