-- CreateTable
CREATE TABLE "ArchivedShop" (
    "id" TEXT NOT NULL,
    "originalShopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT,
    "description" TEXT NOT NULL,
    "contactInfo" JSONB NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "discount" TEXT,
    "discountTerms" TEXT,
    "address" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "schoolId" TEXT NOT NULL,
    "workSchedules" JSONB NOT NULL,
    "images" JSONB NOT NULL,
    "contractFile" JSONB,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalViewTimeSec" INTEGER NOT NULL DEFAULT 0,
    "totalTaps" INTEGER NOT NULL DEFAULT 0,
    "rankingSummary" JSONB,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedShop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedShop_originalShopId_key" ON "ArchivedShop"("originalShopId");

-- CreateIndex
CREATE INDEX "ArchivedShop_schoolId_idx" ON "ArchivedShop"("schoolId");

-- AddForeignKey
ALTER TABLE "ArchivedShop" ADD CONSTRAINT "ArchivedShop_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
