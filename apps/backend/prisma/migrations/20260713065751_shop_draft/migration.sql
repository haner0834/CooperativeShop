-- CreateEnum
CREATE TYPE "ShopDraftStage" AS ENUM ('RESERVED', 'EDITING', 'SUBMITTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('IDLE', 'PROCESSING', 'REJECT', 'SUCCESS', 'SUPERSEDED', 'AI_REJECT');

-- CreateTable
CREATE TABLE "ShopDraft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentVersionId" TEXT,
    "shopId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "normalizedKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactInfo" JSONB NOT NULL,
    "discount" TEXT,
    "workSchedules" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "schoolId" TEXT NOT NULL,
    "stage" "ShopDraftStage" NOT NULL,
    "reservedUntil" TIMESTAMP(3),

    CONSTRAINT "ShopDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopDraftVersion" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "aiReviewResult" JSONB,
    "reviewStatus" "ReviewStatus" NOT NULL,
    "rejectReason" TEXT,
    "reviewerId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ShopDraftVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopDraft_currentVersionId_key" ON "ShopDraft"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDraft_shopId_key" ON "ShopDraft"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDraft_normalizedKey_key" ON "ShopDraft"("normalizedKey");

-- CreateIndex
CREATE INDEX "ShopDraft_normalizedKey_idx" ON "ShopDraft"("normalizedKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDraftVersion_draftId_versionNo_key" ON "ShopDraftVersion"("draftId", "versionNo");

-- AddForeignKey
ALTER TABLE "ShopDraft" ADD CONSTRAINT "ShopDraft_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ShopDraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDraft" ADD CONSTRAINT "ShopDraft_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDraft" ADD CONSTRAINT "ShopDraft_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDraftVersion" ADD CONSTRAINT "ShopDraftVersion_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ShopDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDraftVersion" ADD CONSTRAINT "ShopDraftVersion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
